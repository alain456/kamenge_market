from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from audit.utils import log_action
from core.models import Place
from users.permissions import IsAdmin, IsAdminOrAgent
from .models import Dispute, ReminderHistoryItem
from .serializers import (
    DisputeSerializer, DisputeCreateSerializer,
    SealProcedureSerializer, AddReminderSerializer,
    ReminderHistoryItemSerializer,
)


class DisputeListCreateView(generics.ListCreateAPIView):
    queryset = Dispute.objects.select_related('merchant', 'place').prefetch_related('reminders').all()
    permission_classes = [IsAdminOrAgent]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'risk_level', 'merchant']
    search_fields = ['merchant__full_name', 'place__code']
    ordering_fields = ['total_due', 'opened_at', 'unpaid_months_count']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DisputeCreateSerializer
        return DisputeSerializer

    def perform_create(self, serializer):
        dispute = serializer.save()
        # Set merchant status to EN_LITIGE
        merchant = dispute.merchant
        merchant.status = 'EN_LITIGE'
        merchant.save(update_fields=['status'])
        log_action(
            user=self.request.user,
            action='Dossier contentieux ouvert',
            resource=f'Commerçant {merchant.full_name} – {dispute.place.code}',
            old_status='ACTIF',
            new_status='EN_LITIGE',
            request=self.request,
        )


class DisputeDetailView(generics.RetrieveUpdateAPIView):
    queryset = Dispute.objects.select_related('merchant', 'place').prefetch_related('reminders').all()
    permission_classes = [IsAdminOrAgent]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return DisputeCreateSerializer
        return DisputeSerializer


@api_view(['POST'])
@permission_classes([IsAdmin])
def trigger_seal_procedure(request, pk):
    """
    POST /api/disputes/<pk>/seal/
    Body: { "admin_notes": "Justification ..." }
    Sets dispute → Procédure Scellé and place → SCELLE.
    """
    try:
        dispute = Dispute.objects.select_related('place', 'merchant').get(pk=pk)
    except Dispute.DoesNotExist:
        return Response({'detail': 'Contentieux introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if dispute.status == Dispute.Status.PROCEDURE_SCELLE:
        return Response({'detail': 'Procédure de scellé déjà déclenchée.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = SealProcedureSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    admin_notes = serializer.validated_data['admin_notes']

    old_dispute_status = dispute.status
    dispute.status = Dispute.Status.PROCEDURE_SCELLE
    dispute.admin_notes = admin_notes
    dispute.save(update_fields=['status', 'admin_notes', 'updated_at'])

    place = dispute.place
    old_place_status = place.status
    place.status = Place.Status.SCELLE
    place.notes = f'SCELLE: {admin_notes}'
    place.save(update_fields=['status', 'notes'])

    log_action(
        user=request.user,
        action='Procédure de Scellé Déclenchée',
        resource=f'Emplacement {place.code}',
        old_status=old_place_status,
        new_status='SCELLE',
        details=admin_notes,
        request=request,
    )
    return Response(DisputeSerializer(dispute).data)


@api_view(['POST'])
@permission_classes([IsAdminOrAgent])
def add_reminder(request, pk):
    """
    POST /api/disputes/<pk>/reminders/
    Body: { "type": "Manuel", "channel": "SMS", "destination": "+257...", "content": "..." }
    """
    try:
        dispute = Dispute.objects.get(pk=pk)
    except Dispute.DoesNotExist:
        return Response({'detail': 'Contentieux introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AddReminderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    reminder = serializer.save(dispute=dispute)

    # Update last_reminder_date
    dispute.last_reminder_date = timezone.now().date()
    # Escalate status based on type
    if reminder.type == ReminderHistoryItem.Type.MISE_EN_DEMEURE:
        dispute.status = Dispute.Status.MISE_EN_DEMEURE
    elif reminder.type == ReminderHistoryItem.Type.RAPPEL_J5:
        if dispute.status == Dispute.Status.OUVERT:
            dispute.status = Dispute.Status.RELANCE
    dispute.save(update_fields=['last_reminder_date', 'status', 'updated_at'])

    log_action(
        user=request.user,
        action=f'Relance envoyée ({reminder.type})',
        resource=f'Contentieux {dispute.merchant.full_name}',
        old_status=None,
        new_status=dispute.status,
        details=f'Via {reminder.channel} → {reminder.destination}',
        request=request,
    )
    return Response(ReminderHistoryItemSerializer(reminder).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAdmin])
def regularize_dispute(request, pk):
    """
    POST /api/disputes/<pk>/regularize/
    Marks dispute as Régularisé and restores merchant + place to active status.
    """
    try:
        dispute = Dispute.objects.select_related('merchant', 'place').get(pk=pk)
    except Dispute.DoesNotExist:
        return Response({'detail': 'Contentieux introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    old_status = dispute.status
    dispute.status = Dispute.Status.REGULARISE
    dispute.save(update_fields=['status', 'updated_at'])

    merchant = dispute.merchant
    merchant.status = 'ACTIF'
    merchant.amount_due = 0
    merchant.save(update_fields=['status', 'amount_due'])

    place = dispute.place
    if place.status == Place.Status.SCELLE:
        place.status = Place.Status.OCCUPE
        place.notes = ''
        place.total_due = 0
        place.save(update_fields=['status', 'notes', 'total_due'])

    log_action(
        user=request.user,
        action='Contentieux Régularisé',
        resource=f'Contentieux {merchant.full_name}',
        old_status=old_status,
        new_status='Régularisé',
        request=request,
    )
    return Response(DisputeSerializer(dispute).data)

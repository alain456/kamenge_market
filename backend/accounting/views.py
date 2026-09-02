from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from audit.utils import log_action
from users.permissions import IsAdmin, IsAdminOrAgent
from .models import (
    AccountingAccount, CostCenter,
    AccountingEntry, DisbursementRequest,
)
from .serializers import (
    AccountingAccountSerializer, CostCenterSerializer,
    AccountingEntrySerializer, AccountingEntryCreateSerializer,
    DisbursementRequestSerializer, DisbursementCreateSerializer,
    DisbursementStatusUpdateSerializer,
)

# ── Accounts ──────────────────────────────────────────────────────────────────

class AccountListView(generics.ListCreateAPIView):
    queryset = AccountingAccount.objects.all()
    serializer_class = AccountingAccountSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['account_class', 'category']
    search_fields = ['code', 'name']


class AccountDetailView(generics.RetrieveUpdateAPIView):
    queryset = AccountingAccount.objects.all()
    serializer_class = AccountingAccountSerializer
    permission_classes = [IsAdmin]


# ── Cost Centers ──────────────────────────────────────────────────────────────

class CostCenterListView(generics.ListCreateAPIView):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer
    permission_classes = [IsAdmin]


class CostCenterDetailView(generics.RetrieveUpdateAPIView):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer
    permission_classes = [IsAdmin]


# ── Accounting Entries ────────────────────────────────────────────────────────

class AccountingEntryListView(generics.ListAPIView):
    queryset = AccountingEntry.objects.prefetch_related('lines__account', 'lines__cost_center').all()
    serializer_class = AccountingEntrySerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['entry_number', 'label', 'document_ref']
    ordering_fields = ['date', 'created_at']


class AccountingEntryDetailView(generics.RetrieveAPIView):
    queryset = AccountingEntry.objects.prefetch_related('lines__account').all()
    serializer_class = AccountingEntrySerializer
    permission_classes = [IsAdmin]


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_accounting_entry(request):
    """
    POST /api/accounting/entries/
    Creates a balanced double-entry journal entry.
    Validates totalDebit == totalCredit before saving.
    """
    serializer = AccountingEntryCreateSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    entry = serializer.save()
    log_action(
        user=request.user,
        action='Pièce Comptable Validée',
        resource=f'Pièce {entry.entry_number}',
        old_status='BROUILLON',
        new_status='VALIDE',
        details=entry.label,
        request=request,
    )
    return Response(AccountingEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


# ── Disbursements ─────────────────────────────────────────────────────────────

class DisbursementListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'applicant']
    search_fields = ['request_number', 'applicant__name', 'purpose']
    ordering_fields = ['created_at', 'amount']

    def get_queryset(self):
        return DisbursementRequest.objects.select_related(
            'applicant', 'cost_center',
            'validated_by', 'confirmed_by', 'approved_by',
        ).all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DisbursementCreateSerializer
        return DisbursementRequestSerializer

    def perform_create(self, serializer):
        disb = serializer.save()
        log_action(
            user=self.request.user,
            action='Demande de décaissement créée',
            resource=f'Demande {disb.request_number}',
            old_status='-',
            new_status=DisbursementRequest.Status.BROUILLON,
            details=disb.purpose[:100],
            request=self.request,
        )


class DisbursementDetailView(generics.RetrieveAPIView):
    queryset = DisbursementRequest.objects.select_related(
        'applicant', 'cost_center',
        'validated_by', 'confirmed_by', 'approved_by',
    ).all()
    serializer_class = DisbursementRequestSerializer
    permission_classes = [IsAuthenticated]


# State machine: Brouillon → Validé → Confirmé → Approuvé → Écriture Générée
_NEXT_STATUS = {
    DisbursementRequest.Status.BROUILLON: DisbursementRequest.Status.VALIDE,
    DisbursementRequest.Status.VALIDE: DisbursementRequest.Status.CONFIRME,
    DisbursementRequest.Status.CONFIRME: DisbursementRequest.Status.APPROUVE,
    DisbursementRequest.Status.APPROUVE: DisbursementRequest.Status.ECRITURE_GENEREE,
}


@api_view(['POST'])
@permission_classes([IsAdmin])
def advance_disbursement(request, pk):
    """
    POST /api/disbursements/<pk>/advance/
    Advances the disbursement to the next status in the workflow.
    """
    try:
        disb = DisbursementRequest.objects.select_related('applicant', 'cost_center').get(pk=pk)
    except DisbursementRequest.DoesNotExist:
        return Response({'detail': 'Demande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if disb.status not in _NEXT_STATUS:
        return Response(
            {'detail': f'Impossible de faire avancer une demande au statut « {disb.status} ».'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    old_status = disb.status
    new_status = _NEXT_STATUS[old_status]

    disb.status = new_status
    if new_status == DisbursementRequest.Status.VALIDE:
        disb.validated_by = request.user
    elif new_status == DisbursementRequest.Status.CONFIRME:
        disb.confirmed_by = request.user
    elif new_status == DisbursementRequest.Status.APPROUVE:
        disb.approved_by = request.user
    elif new_status == DisbursementRequest.Status.ECRITURE_GENEREE:
        # Update cost center spent amount
        if disb.cost_center:
            disb.cost_center.spent += disb.amount
            disb.cost_center.save(update_fields=['spent'])

    disb.save()
    log_action(
        user=request.user,
        action=f'Décaissement {new_status}',
        resource=f'Demande {disb.request_number}',
        old_status=old_status,
        new_status=new_status,
        request=request,
    )
    return Response(DisbursementRequestSerializer(disb).data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def reject_disbursement(request, pk):
    """
    POST /api/disbursements/<pk>/reject/
    Body: { "rejection_reason": "..." }
    """
    try:
        disb = DisbursementRequest.objects.get(pk=pk)
    except DisbursementRequest.DoesNotExist:
        return Response({'detail': 'Demande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if disb.status in (DisbursementRequest.Status.ECRITURE_GENEREE, DisbursementRequest.Status.REJETE):
        return Response(
            {'detail': 'Cette demande ne peut plus être rejetée.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rejection_reason = request.data.get('rejection_reason', '').strip()
    if not rejection_reason:
        return Response(
            {'detail': 'Un motif de rejet est obligatoire.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    old_status = disb.status
    disb.status = DisbursementRequest.Status.REJETE
    disb.rejection_reason = rejection_reason
    disb.save(update_fields=['status', 'rejection_reason', 'updated_at'])

    log_action(
        user=request.user,
        action='Décaissement Rejeté',
        resource=f'Demande {disb.request_number}',
        old_status=old_status,
        new_status=DisbursementRequest.Status.REJETE,
        details=rejection_reason,
        request=request,
    )
    return Response(DisbursementRequestSerializer(disb).data)

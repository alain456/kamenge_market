import datetime
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from audit.utils import log_action
from core.models import Place
from users.permissions import IsAdmin, IsAdminOrAgent
from .models import DueDateInvoice, Payment, PaymentSlip
from .serializers import (
    DueDateInvoiceSerializer, PaymentSerializer, PaymentCreateSerializer,
    PaymentSlipSerializer, PaymentSlipCreateSerializer,
    SlipVerifySerializer, GenerateDueDatesSerializer,
)


# ── Due-Date Invoices ─────────────────────────────────────────────────────────

class DueDateInvoiceListView(generics.ListAPIView):
    serializer_class = DueDateInvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'merchant', 'place', 'period']
    search_fields = ['invoice_number', 'merchant__full_name', 'place__code', 'period']
    ordering_fields = ['due_date', 'amount', 'days_overdue']

    def get_queryset(self):
        qs = DueDateInvoice.objects.select_related('merchant', 'place').all()
        user = self.request.user
        if user.is_merchant and hasattr(user, 'merchant_profile'):
            qs = qs.filter(merchant=user.merchant_profile)
        return qs


class DueDateInvoiceDetailView(generics.RetrieveUpdateAPIView):
    queryset = DueDateInvoice.objects.select_related('merchant', 'place').all()
    serializer_class = DueDateInvoiceSerializer
    permission_classes = [IsAdminOrAgent]


@api_view(['POST'])
@permission_classes([IsAdmin])
def generate_monthly_due_dates(request):
    """
    POST /api/due-dates/generate/
    Body: { "period": "Septembre 2026", "due_date": "2026-09-05" }
    Generates one invoice per currently occupied place.
    """
    serializer = GenerateDueDatesSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    period = serializer.validated_data['period']
    due_date = serializer.validated_data['due_date']

    occupied_places = Place.objects.filter(
        status=Place.Status.OCCUPE,
        current_merchant__isnull=False,
    ).select_related('current_merchant', 'current_contract')

    created_count = 0
    year = datetime.date.today().year

    for place in occupied_places:
        # Skip if invoice already exists for this place + period
        if DueDateInvoice.objects.filter(place=place, period=period).exists():
            continue

        count = DueDateInvoice.objects.filter(created_at__year=year).count() + 1
        invoice_number = f'FAC-{year}-{count:05d}'

        DueDateInvoice.objects.create(
            invoice_number=invoice_number,
            period=period,
            merchant=place.current_merchant,
            contract=place.current_contract,
            place=place,
            due_date=due_date,
            amount=place.monthly_rent,
            paid_amount=0,
            remaining_amount=place.monthly_rent,
            status=DueDateInvoice.Status.A_VENIR,
            penalty_amount=0,
            days_overdue=0,
        )
        # Update denormalized last_due_date on Place
        place.last_due_date = due_date
        place.save(update_fields=['last_due_date'])
        created_count += 1

    log_action(
        user=request.user,
        action='Génération Échéances Loyer',
        resource=f'Période {period}',
        old_status='-',
        new_status=f'{created_count} factures créées',
        request=request,
    )
    return Response({'created': created_count, 'period': period})


# ── Payments ──────────────────────────────────────────────────────────────────

class PaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'method', 'merchant']
    search_fields = ['reference', 'merchant__full_name', 'invoice__invoice_number']
    ordering_fields = ['date', 'amount']

    def get_queryset(self):
        qs = Payment.objects.select_related('merchant', 'invoice', 'recorded_by').all()
        user = self.request.user
        if user.is_merchant and hasattr(user, 'merchant_profile'):
            qs = qs.filter(merchant=user.merchant_profile)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrAgent()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        payment = serializer.save()
        log_action(
            user=self.request.user,
            action='Paiement enregistré',
            resource=f'Paiement {payment.reference}',
            old_status='-',
            new_status=payment.status,
            details=f'{payment.amount} BIF – {payment.method}',
            request=self.request,
        )


@api_view(['POST'])
@permission_classes([IsAdminOrAgent])
def confirm_payment(request, pk):
    """
    POST /api/payments/<pk>/confirm/
    Confirms a pending payment and updates the related invoice.
    """
    try:
        payment = Payment.objects.select_related('invoice', 'merchant').get(pk=pk)
    except Payment.DoesNotExist:
        return Response({'detail': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if payment.status == Payment.Status.CONFIRME:
        return Response({'detail': 'Ce paiement est déjà confirmé.'}, status=status.HTTP_400_BAD_REQUEST)

    old_status = payment.status
    payment.status = Payment.Status.CONFIRME
    payment.save(update_fields=['status'])

    # Apply payment to linked invoice
    if payment.invoice:
        invoice = payment.invoice
        invoice.paid_amount += payment.amount
        invoice.remaining_amount = max(0, invoice.amount - invoice.paid_amount)
        if invoice.remaining_amount == 0:
            invoice.status = DueDateInvoice.Status.PAYEE
        elif invoice.paid_amount > 0:
            invoice.status = DueDateInvoice.Status.PARTIELLEMENT_PAYEE
        invoice.save(update_fields=['paid_amount', 'remaining_amount', 'status'])

        # Update merchant total due
        merchant = payment.merchant
        merchant.amount_due = max(0, merchant.amount_due - payment.amount)
        merchant.last_activity = timezone.now()
        merchant.save(update_fields=['amount_due', 'last_activity'])

    log_action(
        user=request.user,
        action='Paiement Confirmé',
        resource=f'Paiement {payment.reference}',
        old_status=old_status,
        new_status=Payment.Status.CONFIRME,
        request=request,
    )
    return Response(PaymentSerializer(payment, context={'request': request}).data)


# ── Payment Slips ─────────────────────────────────────────────────────────────

class PaymentSlipListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'merchant', 'place']
    search_fields = ['slip_number', 'merchant__full_name', 'place__code']

    def get_queryset(self):
        qs = PaymentSlip.objects.select_related('merchant', 'place', 'verified_by').all()
        user = self.request.user
        if user.is_merchant and hasattr(user, 'merchant_profile'):
            qs = qs.filter(merchant=user.merchant_profile)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentSlipCreateSerializer
        return PaymentSlipSerializer

    def perform_create(self, serializer):
        slip = serializer.save()
        # Move place to PREUVE_EN_ATTENTE
        place = slip.place
        if place.status == Place.Status.OCCUPE:
            place.status = Place.Status.PREUVE_EN_ATTENTE
            place.save(update_fields=['status'])
        log_action(
            user=self.request.user,
            action='Bordereau soumis',
            resource=f'Bordereau {slip.slip_number}',
            old_status='OCCUPE',
            new_status='PREUVE_EN_ATTENTE',
            request=self.request,
        )


class PaymentSlipDetailView(generics.RetrieveAPIView):
    queryset = PaymentSlip.objects.select_related('merchant', 'place', 'verified_by').all()
    serializer_class = PaymentSlipSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAdminOrAgent])
def verify_payment_slip(request, pk):
    """
    POST /api/payment-slips/<pk>/verify/
    Body: { "decision": "APPROUVE"|"REJETE", "comment": "...", "rejection_reason": "..." }
    """
    try:
        slip = PaymentSlip.objects.select_related('merchant', 'place').get(pk=pk)
    except PaymentSlip.DoesNotExist:
        return Response({'detail': 'Bordereau introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if slip.status != PaymentSlip.Status.EN_ATTENTE:
        return Response(
            {'detail': 'Ce bordereau a déjà été traité.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = SlipVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    decision = serializer.validated_data['decision']
    comment = serializer.validated_data.get('comment', '')
    rejection_reason = serializer.validated_data.get('rejection_reason', '')

    slip.status = decision
    slip.verified_by = request.user
    slip.verification_date = timezone.now()
    slip.comment = comment
    slip.rejection_reason = rejection_reason
    slip.save()

    # Side effects
    if decision == PaymentSlip.Status.APPROUVE:
        place = slip.place
        if place.status == Place.Status.PREUVE_EN_ATTENTE:
            place.status = Place.Status.OCCUPE
            place.save(update_fields=['status'])
    else:
        # On rejection revert place to OCCUPE so merchant can resubmit
        place = slip.place
        if place.status == Place.Status.PREUVE_EN_ATTENTE:
            place.status = Place.Status.OCCUPE
            place.save(update_fields=['status'])

    log_action(
        user=request.user,
        action=f'Bordereau {"Approuvé" if decision == "APPROUVE" else "Rejeté"}',
        resource=f'Bordereau {slip.slip_number}',
        old_status='EN_ATTENTE',
        new_status=decision,
        details=comment or rejection_reason or None,
        request=request,
    )
    return Response(PaymentSlipSerializer(slip, context={'request': request}).data)

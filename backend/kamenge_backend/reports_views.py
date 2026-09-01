"""
Aggregated reporting endpoints — no models of their own,
they query across all apps.
"""
from datetime import date
from django.db.models import Sum, Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from users.permissions import IsAdmin, IsAdminOrAgent
from core.models import Place
from merchants.models import Merchant, Contract
from invoicing.models import DueDateInvoice, Payment, PaymentSlip
from disputes.models import Dispute


@api_view(['GET'])
@permission_classes([IsAdminOrAgent])
def dashboard_stats(request):
    """
    GET /api/reports/dashboard/
    Returns the key KPIs shown on the admin dashboard.
    """
    total_places = Place.objects.count()
    occupied = Place.objects.filter(status=Place.Status.OCCUPE).count()
    libre = Place.objects.filter(status=Place.Status.LIBRE).count()
    impaye = Place.objects.filter(status=Place.Status.IMPAYE).count()
    scelle = Place.objects.filter(status=Place.Status.SCELLE).count()
    maintenance = Place.objects.filter(status=Place.Status.MAINTENANCE).count()
    preuve = Place.objects.filter(status=Place.Status.PREUVE_EN_ATTENTE).count()
    occupancy_rate = round((occupied / total_places * 100), 1) if total_places else 0

    total_arrears = (
        Merchant.objects.aggregate(total=Sum('amount_due'))['total'] or 0
    )

    pending_slips = PaymentSlip.objects.filter(status=PaymentSlip.Status.EN_ATTENTE).count()
    open_disputes = Dispute.objects.exclude(
        status__in=['Régularisé', 'Procédure Scellé']
    ).count()

    monthly_revenue = (
        Payment.objects.filter(status=Payment.Status.CONFIRME)
        .aggregate(total=Sum('amount'))['total'] or 0
    )

    # Priority unpaid list (top 5 by amount due)
    priority_unpaid = list(
        Merchant.objects.filter(amount_due__gt=0)
        .order_by('-amount_due')
        .values('id', 'full_name', 'amount_due', 'status')[:5]
    )

    # Pending slips detail
    pending_slip_list = list(
        PaymentSlip.objects.filter(status=PaymentSlip.Status.EN_ATTENTE)
        .select_related('merchant', 'place')
        .values(
            'id', 'slip_number',
            'merchant__full_name', 'place__code',
            'declared_amount', 'expected_amount',
            'submission_date',
        )[:10]
    )

    return Response({
        'places': {
            'total': total_places,
            'occupied': occupied,
            'libre': libre,
            'impaye': impaye,
            'scelle': scelle,
            'maintenance': maintenance,
            'preuve_en_attente': preuve,
            'occupancy_rate_percent': occupancy_rate,
        },
        'financials': {
            'total_arrears_bif': total_arrears,
            'monthly_revenue_bif': monthly_revenue,
        },
        'pending_slips_count': pending_slips,
        'open_disputes_count': open_disputes,
        'priority_unpaid': priority_unpaid,
        'pending_slips': pending_slip_list,
    })


@api_view(['GET'])
@permission_classes([IsAdminOrAgent])
def revenue_report(request):
    """
    GET /api/reports/revenue/?year=2026
    Returns confirmed payment totals aggregated by month for the requested year,
    plus revenue breakdown by place type.
    """
    year = int(request.query_params.get('year', date.today().year))

    # Monthly totals
    monthly = []
    month_names = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
    ]
    for month_num in range(1, 13):
        total = (
            Payment.objects.filter(
                status=Payment.Status.CONFIRME,
                date__year=year,
                date__month=month_num,
            ).aggregate(total=Sum('amount'))['total'] or 0
        )
        monthly.append({'month': month_names[month_num - 1], 'revenue': total})

    # Revenue by place type
    by_type = []
    for place_type in Place.Type.values:
        place_ids = Place.objects.filter(type=place_type).values_list('id', flat=True)
        total = (
            Payment.objects.filter(
                status=Payment.Status.CONFIRME,
                date__year=year,
                invoice__place_id__in=place_ids,
            ).aggregate(total=Sum('amount'))['total'] or 0
        )
        by_type.append({'type': place_type, 'revenue': total})

    # Invoice collection rate for the year
    total_invoiced = (
        DueDateInvoice.objects.filter(created_at__year=year)
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    total_collected = (
        DueDateInvoice.objects.filter(created_at__year=year)
        .aggregate(total=Sum('paid_amount'))['total'] or 0
    )
    collection_rate = round(total_collected / total_invoiced * 100, 1) if total_invoiced else 0

    return Response({
        'year': year,
        'monthly_revenue': monthly,
        'revenue_by_place_type': by_type,
        'collection_rate_percent': collection_rate,
        'total_invoiced_bif': total_invoiced,
        'total_collected_bif': total_collected,
    })

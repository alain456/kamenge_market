"""
Aggregated reporting endpoints — no models of their own,
they query across all apps.
"""
from datetime import date
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdmin, IsAdminOrAgent
from users.models import User
from core.models import Place
from merchants.models import Merchant, Contract
from invoicing.models import DueDateInvoice, Payment, PaymentSlip
from disputes.models import Dispute


def _priority_unpaid_list():
    items = []
    merchants = (
        Merchant.objects.filter(amount_due__gt=0)
        .prefetch_related('contracts__place')
        .order_by('-amount_due')[:5]
    )
    for merchant in merchants:
        place = merchant.assigned_place
        items.append({
            'id': merchant.id,
            'full_name': merchant.full_name,
            'amount_due': merchant.amount_due,
            'status': merchant.status,
            'place_code': place.code if place else '—',
            'unpaid_months_count': Dispute.objects.filter(
                merchant=merchant,
            ).values_list('unpaid_months_count', flat=True).first() or 0,
        })
    return items


@api_view(['GET'])
@permission_classes([IsAdminOrAgent])
def dashboard_stats(request):
    """
    GET /api/reports/dashboard/
    Returns the key KPIs shown on the admin dashboard.
    """
    today = timezone.now().date()

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
    approved_slips = PaymentSlip.objects.filter(status=PaymentSlip.Status.APPROUVE).count()
    open_disputes = Dispute.objects.exclude(
        status__in=['Régularisé', 'Procédure Scellé']
    ).count()

    monthly_revenue = (
        Payment.objects.filter(
            status=Payment.Status.CONFIRME,
            date__year=today.year,
            date__month=today.month,
        ).aggregate(total=Sum('amount'))['total'] or 0
    )

    merchants_total = Merchant.objects.count()
    merchants_active = Merchant.objects.filter(status=Merchant.Status.ACTIF).count()
    contracts_active = Contract.objects.filter(status=Contract.Status.ACTIF).count()
    contracts_terminated = Contract.objects.filter(status=Contract.Status.RESILIE).count()
    staff_total = User.objects.filter(staff_role__isnull=False).count()

    priority_unpaid = _priority_unpaid_list()

    pending_slip_list = list(
        PaymentSlip.objects.filter(status=PaymentSlip.Status.EN_ATTENTE)
        .select_related('merchant', 'place')
        .values(
            'id', 'slip_number',
            'merchant__full_name', 'place__code',
            'declared_amount', 'expected_amount',
            'submission_date', 'method',
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
        'merchants': {
            'total': merchants_total,
            'active': merchants_active,
        },
        'contracts': {
            'active': contracts_active,
            'terminated': contracts_terminated,
        },
        'staff': {
            'total': staff_total,
        },
        'pending_slips_count': pending_slips,
        'approved_slips_count': approved_slips,
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


def _task(task_id, title, description, link, priority='medium', meta=''):
    return {
        'id': task_id,
        'title': title,
        'description': description,
        'link': link,
        'priority': priority,
        'meta': meta,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tasks(request):
    """Tâches du jour selon le rôle de l'utilisateur connecté."""
    user = request.user
    role = user.effective_role_slug
    role_name = user.staff_role.name if user.staff_role_id else role
    area = user.assigned_area
    tasks = []

    pending_slips = PaymentSlip.objects.filter(status=PaymentSlip.Status.EN_ATTENTE).select_related('merchant', 'place', 'place__zone')
    open_disputes = Dispute.objects.exclude(status__in=['Régularisé', 'Procédure Scellé']).select_related('merchant', 'place')
    libre_places = Place.objects.filter(status=Place.Status.LIBRE).select_related('zone')
    merchants_due = Merchant.objects.filter(amount_due__gt=0)

    if role == 'admin':
        for slip in pending_slips[:5]:
            tasks.append(_task(
                f'slip-{slip.id}',
                f'Vérifier bordereau {slip.slip_number}',
                f'{slip.merchant.full_name} — {slip.place.code}',
                '/finances/bordereaux',
                'high',
                f'{slip.declared_amount:,} BIF'.replace(',', ' '),
            ))
        for dispute in open_disputes[:5]:
            tasks.append(_task(
                f'disp-{dispute.id}',
                f'Contentieux {dispute.merchant.full_name}',
                f'{dispute.place.code} — {dispute.unpaid_months_count} mois impayés',
                f'/plaintes',
                'high' if dispute.risk_level in ('ELEVE', 'CRITIQUE') else 'medium',
                f'{dispute.total_due:,} BIF'.replace(',', ' '),
            ))
        tasks.append(_task(
            'users',
            'Gérer le personnel',
            f'{User.objects.filter(staff_role__isnull=False).count()} comptes actifs',
            '/administration/utilisateurs',
            'low',
        ))

    elif role == 'comptable':
        for slip in pending_slips[:8]:
            tasks.append(_task(
                f'slip-{slip.id}',
                f'Valider bordereau {slip.slip_number}',
                f'{slip.merchant.full_name}',
                '/finances/bordereaux',
                'high',
            ))
        from accounting.models import DisbursementRequest
        for dec in DisbursementRequest.objects.filter(status='Confirmé')[:5]:
            tasks.append(_task(
                f'dec-{dec.id}',
                f'Approuver décaissement {dec.request_number}',
                dec.purpose[:80],
                '/finances/comptabilite',
                'medium',
                f'{dec.amount:,} BIF'.replace(',', ' '),
            ))

    elif role == 'caissier':
        today = timezone.now().date()
        today_payments = Payment.objects.filter(date=today, status=Payment.Status.CONFIRME).count()
        tasks.append(_task(
            'cash-today',
            'Encaissements du jour',
            f'{today_payments} opération(s) enregistrée(s) aujourd\'hui',
            '/finances',
            'medium',
        ))
        for slip in pending_slips[:5]:
            tasks.append(_task(
                f'slip-{slip.id}',
                f'Bordereau à traiter {slip.slip_number}',
                slip.merchant.full_name,
                '/finances/bordereaux',
                'high',
            ))

    elif role == 'secretaire':
        for dispute in open_disputes[:6]:
            tasks.append(_task(
                f'disp-{dispute.id}',
                f'Suivi contentieux — {dispute.merchant.full_name}',
                f'Statut: {dispute.status}',
                f'/plaintes',
                'medium',
            ))
        tasks.append(_task(
            'merchants',
            'Mettre à jour fiches commerçants',
            f'{Merchant.objects.filter(status="ACTIF").count()} commerçants actifs',
            '/commerce',
            'low',
        ))

    elif role == 'agent_perception':
        qs = merchants_due.order_by('-amount_due')
        if area:
            qs = qs.filter(contracts__place__zone__name__icontains=area)
        for merchant in qs.distinct()[:8]:
            place = merchant.assigned_place
            tasks.append(_task(
                f'perc-{merchant.id}',
                f'Percevoir loyers — {merchant.full_name}',
                place.code if place else 'Sans emplacement',
                '/finances',
                'high',
                f'{merchant.amount_due:,} BIF'.replace(',', ' '),
            ))

    elif role == 'agent_enregistrement':
        for place in libre_places[:6]:
            tasks.append(_task(
                f'place-{place.id}',
                f'Attribuer emplacement {place.code}',
                f'{place.zone.name} — {place.type}',
                '/espaces',
                'medium',
                f'{place.monthly_rent:,} BIF/mois'.replace(',', ' '),
            ))
        recent_merchants = Merchant.objects.order_by('-registered_at')[:3]
        for m in recent_merchants:
            tasks.append(_task(
                f'merch-{m.id}',
                f'Compléter dossier — {m.full_name}',
                'Vérifier contrat et documents',
                f'/commerce/{m.id}',
                'low',
            ))

    else:
        for slip in pending_slips[:3]:
            tasks.append(_task(
                f'slip-{slip.id}',
                f'Bordereau {slip.slip_number}',
                slip.merchant.full_name,
                '/finances',
                'medium',
            ))

    stats = {
        'pending_slips': pending_slips.count(),
        'open_disputes': open_disputes.count(),
        'libre_places': libre_places.count(),
        'merchants_with_debt': merchants_due.count(),
    }

    return Response({
        'role': role,
        'role_name': role_name,
        'assigned_area': area,
        'tasks': tasks,
        'stats': stats,
    })

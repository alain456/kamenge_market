"""
Management command: python manage.py seed

Populates the database with the same data that was in the TypeScript mock files,
so the React frontend works against the real API immediately.

Usage:
    python manage.py seed           # inserts data, skips existing rows
    python manage.py seed --flush   # wipes all app tables first, then seeds
"""
import datetime
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Seed the database with initial Mall Kamenge demo data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete all existing data before seeding.',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self._flush()

        with transaction.atomic():
            self._seed_settings()
            roles = self._seed_staff_roles()
            users = self._seed_users(roles)
            zones = self._seed_zones()
            merchants = self._seed_merchants(users)
            places = self._seed_places(zones, merchants)
            contracts = self._seed_contracts(merchants, places)
            self._link_places_to_contracts(places, merchants, contracts)
            invoices = self._seed_invoices(merchants, places, contracts)
            self._seed_payments(merchants, invoices, users)
            self._seed_payment_slips(merchants, places)
            self._seed_disputes(merchants, places)
            self._seed_accounting(users)
            self._seed_disbursements(users)
            self._seed_audit_logs(users)

        self.stdout.write(self.style.SUCCESS('✓ Database seeded successfully.'))

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _flush(self):
        self.stdout.write('Flushing existing data...')
        from audit.models import AuditLog
        from market_settings.models import MarketSettings
        from accounting.models import DisbursementRequest, AccountingEntry, AccountingAccount, CostCenter
        from disputes.models import ReminderHistoryItem, Dispute
        from invoicing.models import PaymentSlip, Payment, DueDateInvoice
        from merchants.models import Contract, Merchant
        from core.models import Place, Zone
        from users.models import User

        AuditLog.objects.all().delete()
        DisbursementRequest.objects.all().delete()
        AccountingEntry.objects.all().delete()
        AccountingAccount.objects.all().delete()
        CostCenter.objects.all().delete()
        ReminderHistoryItem.objects.all().delete()
        Dispute.objects.all().delete()
        PaymentSlip.objects.all().delete()
        Payment.objects.all().delete()
        DueDateInvoice.objects.all().delete()
        Contract.objects.all().delete()
        Place.objects.all().delete()
        Merchant.objects.all().delete()
        Zone.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        MarketSettings.objects.all().delete()
        self.stdout.write('  Done.')

    # ── Settings ──────────────────────────────────────────────────────────────

    def _seed_settings(self):
        from market_settings.models import MarketSettings
        MarketSettings.objects.update_or_create(
            pk=1,
            defaults=dict(
                name='Mall Kamenge',
                city='Bujumbura, Burundi',
                currency='BIF',
                penalty_rate_percent=5,
                billing_day_of_month=1,
                grace_period_days=5,
                decimal_precision=0,
                sms_notifications_enabled=True,
                email_notifications_enabled=True,
            ),
        )
        self.stdout.write('  ✓ Settings')

    # ── Staff Roles ───────────────────────────────────────────────────────────

    def _seed_staff_roles(self):
        from users.models import StaffRole
        from users.rbac_seed_data import STAFF_ROLES

        roles = {}
        for data in STAFF_ROLES:
            slug = data['slug']
            role, _ = StaffRole.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': data['name'],
                    'description': data['description'],
                    'permissions': data['permissions'],
                    'is_system_role': data['is_system_role'],
                },
            )
            roles[slug] = role
        self.stdout.write('  ✓ Staff roles')
        return roles

    # ── Users ─────────────────────────────────────────────────────────────────

    def _seed_users(self, roles):
        from users.models import User, Role
        from users.rbac_seed_data import STAFF_USERS

        users = {}
        demo_password = 'kamenge2026'

        for d in STAFF_USERS:
            email = d['email']
            role_slug = d.pop('role_slug')
            staff_role = roles[role_slug]
            legacy_role = Role.ADMIN if role_slug == 'admin' else Role.AGENT
            u, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': d['name'],
                    'phone': d.get('phone', ''),
                    'status': d.get('status', 'ACTIF'),
                    'role': legacy_role,
                    'staff_role': staff_role,
                    'assigned_area': d.get('assigned_area', ''),
                },
            )
            if not created:
                u.name = d['name']
                u.phone = d.get('phone', '')
                u.status = d.get('status', 'ACTIF')
                u.role = legacy_role
                u.staff_role = staff_role
                u.assigned_area = d.get('assigned_area', '')
            u.set_password(demo_password)
            u.save()
            users[email] = u

        # Merchant portal account (no staff role)
        merchant_data = dict(
            name='Gérard Bizimana',
            role=Role.MERCHANT,
            phone='+257 71 555 666',
            status='ACTIF',
        )
        merchant, created = User.objects.get_or_create(
            email='commercant@kamenge-mall.bi',
            defaults=merchant_data,
        )
        if not created:
            for field, value in merchant_data.items():
                setattr(merchant, field, value)
            merchant.staff_role = None
        merchant.set_password(demo_password)
        merchant.save()
        users['commercant@kamenge-mall.bi'] = merchant

        self.stdout.write('  ✓ Users (password: kamenge2026)')
        return users

    # ── Zones ─────────────────────────────────────────────────────────────────

    def _seed_zones(self):
        from core.models import Zone
        data = [
            ('Z-BLOC-A', 'Zone Commerciale Bloc A', 'Boutiques principales rez-de-chaussée et étage 1', 24),
            ('Z-BLOC-B', 'Zone Commerciale Bloc B', 'Zone alimentation et textiles grossistes', 18),
            ('Z-PARKING', 'Parking & Abord', 'Kiosques externes et stands événementiels', 12),
            ('Z-SEC', 'Sécurité & Services', 'Postes de garde et locaux techniques', 6),
            ('Z-NET', 'Service Nettoyage', 'Dépôts et magasins de maintenance', 4),
            ('Z-ADM', 'Administration', 'Bureaux administratifs et salles de réunion', 8),
        ]
        zones = {}
        for code, name, desc, total in data:
            z, _ = Zone.objects.get_or_create(code=code, defaults=dict(name=name, description=desc, total_places=total))
            zones[code] = z
        self.stdout.write('  ✓ Zones')
        return zones

    # ── Merchants ─────────────────────────────────────────────────────────────

    def _seed_merchants(self, users):
        from merchants.models import Merchant
        data = [
            dict(full_name='Jean-Pierre Mugisha', phone='+257 79 111 222', email='jp.mugisha@gmail.com',
                 identity_card_number='110/2018/BUJ', status='ACTIF', amount_due=0),
            dict(full_name='Aline Irakoze', phone='+257 76 333 444', email='aline.irakoze@yahoo.fr',
                 identity_card_number='115/2019/BUJ', status='ACTIF', amount_due=0),
            dict(full_name='Gérard Bizimana', phone='+257 71 555 666', email='gerard.bizimana@outlook.com',
                 identity_card_number='120/2017/BUJ', status='EN_LITIGE', amount_due=1575000,
                 user=users.get('commercant@kamenge-mall.bi')),
            dict(full_name='Belyse Uwimana', phone='+257 75 777 888', email='belyse.uwimana@gmail.com',
                 identity_card_number='128/2020/BUJ', status='ACTIF', amount_due=400000),
            dict(full_name='Elias Ndayishimiye', phone='+257 78 999 000', email='elias.ndayishimiye@hot.fr',
                 identity_card_number='098/2015/BUJ', status='EN_LITIGE', amount_due=2100000),
            dict(full_name='Clara Niyonzima', phone='+257 79 444 111', email='clara.niyonzima@gmail.com',
                 identity_card_number='133/2021/BUJ', status='ACTIF', amount_due=0),
            dict(full_name='Fabrice Kwizera', phone='+257 71 222 333', email='fabrice.kwizera@gmail.com',
                 identity_card_number='140/2022/BUJ', status='ACTIF', amount_due=0),
            dict(full_name='Patrick Harerimana', phone='+257 76 888 999', email='p.harerimana@gmail.com',
                 identity_card_number='105/2016/BUJ', status='EN_LITIGE', amount_due=819000),
            dict(full_name='Désiré Nshimirimana', phone='+257 75 111 999', email='desire.nsh@gmail.com',
                 identity_card_number='142/2023/BUJ', status='ACTIF', amount_due=0),
        ]
        merchants = {}
        for d in data:
            cin = d['identity_card_number']
            m, _ = Merchant.objects.get_or_create(identity_card_number=cin, defaults=d)
            merchants[cin] = m
        self.stdout.write('  ✓ Merchants')
        return merchants

    # ── Places ────────────────────────────────────────────────────────────────

    def _seed_places(self, zones, merchants):
        from core.models import Place
        # merchant lookup by CIN
        def m(cin): return merchants.get(cin)

        data = [
            dict(code='MALL-N1-A01', zone=zones['Z-BLOC-A'], type='Boutique', surface_m2=35,
                 monthly_rent=450000, status='OCCUPE'),
            dict(code='MALL-N1-A02', zone=zones['Z-BLOC-A'], type='Boutique', surface_m2=28,
                 monthly_rent=380000, status='OCCUPE'),
            dict(code='MALL-N1-A03', zone=zones['Z-BLOC-A'], type='Boutique', surface_m2=40,
                 monthly_rent=500000, status='IMPAYE', total_due=1575000,
                 notes='3 mois d\'arriérés + pénalités 5%'),
            dict(code='MALL-N1-A04', zone=zones['Z-BLOC-A'], type='Boutique', surface_m2=30,
                 monthly_rent=400000, status='PREUVE_EN_ATTENTE', total_due=400000,
                 notes='Bordereau versé hier en attente de validation'),
            dict(code='MALL-N1-A05', zone=zones['Z-BLOC-A'], type='Boutique', surface_m2=25,
                 monthly_rent=350000, status='LIBRE'),
            dict(code='MALL-N1-A06', zone=zones['Z-BLOC-A'], type='Boutique', surface_m2=32,
                 monthly_rent=420000, status='SCELLE', total_due=2100000,
                 notes='Fermeture et scellé suite à mise en demeure infructueuse'),
            dict(code='MALL-N1-B01', zone=zones['Z-BLOC-B'], type='Boutique', surface_m2=22,
                 monthly_rent=300000, status='OCCUPE'),
            dict(code='MALL-N1-B02', zone=zones['Z-BLOC-B'], type='Kiosque', surface_m2=12,
                 monthly_rent=180000, status='MAINTENANCE',
                 notes='Rénovation électrique du kiosque en cours'),
            dict(code='MALL-N1-B03', zone=zones['Z-BLOC-B'], type='Kiosque', surface_m2=15,
                 monthly_rent=200000, status='LIBRE'),
            dict(code='MALL-N1-B04', zone=zones['Z-BLOC-B'], type='Stand', surface_m2=10,
                 monthly_rent=150000, status='OCCUPE'),
            dict(code='MALL-N1-B05', zone=zones['Z-BLOC-B'], type='Boutique', surface_m2=30,
                 monthly_rent=390000, status='IMPAYE', total_due=819000),
            dict(code='MALL-N1-B06', zone=zones['Z-BLOC-B'], type='Boutique', surface_m2=26,
                 monthly_rent=340000, status='LIBRE'),
            dict(code='MALL-PKG-K01', zone=zones['Z-PARKING'], type='Kiosque', surface_m2=14,
                 monthly_rent=220000, status='OCCUPE'),
            dict(code='MALL-PKG-S01', zone=zones['Z-PARKING'], type='Stand', surface_m2=18,
                 monthly_rent=250000, status='LIBRE'),
        ]
        places = {}
        for d in data:
            code = d['code']
            p, _ = Place.objects.get_or_create(code=code, defaults=d)
            places[code] = p
        self.stdout.write('  ✓ Places')
        return places

    # ── Contracts ─────────────────────────────────────────────────────────────

    def _seed_contracts(self, merchants, places):
        from merchants.models import Contract
        def m(cin): return merchants[cin]
        def p(code): return places[code]

        data = [
            dict(code='CTR-2024-001', merchant=m('110/2018/BUJ'), place=p('MALL-N1-A01'),
                 start_date='2024-01-15', end_date='2027-01-14', monthly_rent=450000,
                 deposit_months=3, deposit_amount=1350000, periodicity='Mensuel',
                 status='ACTIF', sublease_allowed=False, notes='Boutique d\'habillement de marque'),
            dict(code='CTR-2024-002', merchant=m('115/2019/BUJ'), place=p('MALL-N1-A02'),
                 start_date='2024-03-01', end_date='2026-02-28', monthly_rent=380000,
                 deposit_months=2, deposit_amount=760000, periodicity='Mensuel',
                 status='ACTIF', sublease_allowed=False, notes='Salon de coiffure et cosmétiques'),
            dict(code='CTR-2023-045', merchant=m('120/2017/BUJ'), place=p('MALL-N1-A03'),
                 start_date='2023-06-10', end_date='2025-06-09', monthly_rent=500000,
                 deposit_months=3, deposit_amount=1500000, periodicity='Mensuel',
                 status='EN_LITIGE', sublease_allowed=False, notes='Magasin d\'électronique'),
            dict(code='CTR-2024-012', merchant=m('128/2020/BUJ'), place=p('MALL-N1-A04'),
                 start_date='2024-05-12', end_date='2027-05-11', monthly_rent=400000,
                 deposit_months=3, deposit_amount=1200000, periodicity='Mensuel',
                 status='ACTIF', sublease_allowed=False, notes='Boutique de chaussures'),
            dict(code='CTR-2022-088', merchant=m('098/2015/BUJ'), place=p('MALL-N1-A06'),
                 start_date='2022-11-20', end_date='2025-11-19', monthly_rent=420000,
                 deposit_months=3, deposit_amount=1260000, periodicity='Mensuel',
                 status='EN_LITIGE', sublease_allowed=False, notes='Vente de matériel informatique'),
            dict(code='CTR-2024-008', merchant=m('133/2021/BUJ'), place=p('MALL-N1-B01'),
                 start_date='2024-02-18', end_date='2027-02-17', monthly_rent=300000,
                 deposit_months=2, deposit_amount=600000, periodicity='Mensuel',
                 status='ACTIF', sublease_allowed=False, notes='Superette alimentation générale'),
            dict(code='CTR-2024-020', merchant=m('140/2022/BUJ'), place=p('MALL-N1-B04'),
                 start_date='2024-06-01', end_date='2025-05-31', monthly_rent=150000,
                 deposit_months=2, deposit_amount=300000, periodicity='Mensuel',
                 status='ACTIF', sublease_allowed=False, notes='Stand accessoires téléphoniques'),
            dict(code='CTR-2023-077', merchant=m('105/2016/BUJ'), place=p('MALL-N1-B05'),
                 start_date='2023-09-15', end_date='2026-09-14', monthly_rent=390000,
                 deposit_months=3, deposit_amount=1170000, periodicity='Mensuel',
                 status='EN_LITIGE', sublease_allowed=False, notes='Quincaillerie du marché'),
            dict(code='CTR-2024-015', merchant=m('142/2023/BUJ'), place=p('MALL-PKG-K01'),
                 start_date='2024-04-10', end_date='2026-04-09', monthly_rent=220000,
                 deposit_months=2, deposit_amount=440000, periodicity='Mensuel',
                 status='ACTIF', sublease_allowed=False, notes='Kiosque transfert d\'argent & Mobile Money'),
        ]
        contracts = {}
        for d in data:
            code = d['code']
            c, _ = Contract.objects.get_or_create(code=code, defaults=d)
            contracts[code] = c
        self.stdout.write('  ✓ Contracts')
        return contracts

    # ── Link places to their current merchant/contract ─────────────────────────

    def _link_places_to_contracts(self, places, merchants, contracts):
        from core.models import Place
        mapping = {
            'MALL-N1-A01': ('110/2018/BUJ', 'CTR-2024-001', '2026-08-01'),
            'MALL-N1-A02': ('115/2019/BUJ', 'CTR-2024-002', '2026-08-01'),
            'MALL-N1-A03': ('120/2017/BUJ', 'CTR-2023-045', '2026-06-01'),
            'MALL-N1-A04': ('128/2020/BUJ', 'CTR-2024-012', '2026-08-01'),
            'MALL-N1-A06': ('098/2015/BUJ', 'CTR-2022-088', '2026-04-01'),
            'MALL-N1-B01': ('133/2021/BUJ', 'CTR-2024-008', '2026-08-01'),
            'MALL-N1-B04': ('140/2022/BUJ', 'CTR-2024-020', '2026-08-01'),
            'MALL-N1-B05': ('105/2016/BUJ', 'CTR-2023-077', '2026-07-01'),
            'MALL-PKG-K01': ('142/2023/BUJ', 'CTR-2024-015', '2026-08-01'),
        }
        for place_code, (cin, contract_code, last_due) in mapping.items():
            place = places.get(place_code)
            merchant = merchants.get(cin)
            contract = contracts.get(contract_code)
            if place and merchant and contract:
                place.current_merchant = merchant
                place.current_contract = contract
                place.last_due_date = datetime.date.fromisoformat(last_due)
                place.save(update_fields=['current_merchant', 'current_contract', 'last_due_date'])
        self.stdout.write('  ✓ Place→Contract links')

    # ── Invoices ──────────────────────────────────────────────────────────────

    def _seed_invoices(self, merchants, places, contracts):
        from invoicing.models import DueDateInvoice
        def m(cin): return merchants[cin]
        def p(code): return places[code]
        def c(code): return contracts.get(code)

        data = [
            dict(invoice_number='FAC-2026-08-001', period='Août 2026',
                 merchant=m('110/2018/BUJ'), place=p('MALL-N1-A01'), contract=c('CTR-2024-001'),
                 due_date='2026-08-05', amount=450000, paid_amount=450000,
                 remaining_amount=0, status='PAYEE', penalty_amount=0, days_overdue=0),
            dict(invoice_number='FAC-2026-08-002', period='Août 2026',
                 merchant=m('115/2019/BUJ'), place=p('MALL-N1-A02'), contract=c('CTR-2024-002'),
                 due_date='2026-08-05', amount=380000, paid_amount=380000,
                 remaining_amount=0, status='PAYEE', penalty_amount=0, days_overdue=0),
            dict(invoice_number='FAC-2026-08-003', period='Août 2026',
                 merchant=m('120/2017/BUJ'), place=p('MALL-N1-A03'), contract=c('CTR-2023-045'),
                 due_date='2026-08-05', amount=500000, paid_amount=0,
                 remaining_amount=500000, status='EN_RETARD', penalty_amount=25000, days_overdue=21),
            dict(invoice_number='FAC-2026-07-003', period='Juillet 2026',
                 merchant=m('120/2017/BUJ'), place=p('MALL-N1-A03'), contract=c('CTR-2023-045'),
                 due_date='2026-07-05', amount=500000, paid_amount=0,
                 remaining_amount=500000, status='EN_RETARD', penalty_amount=25000, days_overdue=52),
            dict(invoice_number='FAC-2026-06-003', period='Juin 2026',
                 merchant=m('120/2017/BUJ'), place=p('MALL-N1-A03'), contract=c('CTR-2023-045'),
                 due_date='2026-06-05', amount=500000, paid_amount=0,
                 remaining_amount=500000, status='EN_RETARD', penalty_amount=25000, days_overdue=82),
            dict(invoice_number='FAC-2026-08-004', period='Août 2026',
                 merchant=m('128/2020/BUJ'), place=p('MALL-N1-A04'), contract=c('CTR-2024-012'),
                 due_date='2026-08-05', amount=400000, paid_amount=0,
                 remaining_amount=400000, status='PARTIELLEMENT_PAYEE', penalty_amount=0, days_overdue=0),
            dict(invoice_number='FAC-2026-08-008', period='Août 2026',
                 merchant=m('105/2016/BUJ'), place=p('MALL-N1-B05'), contract=c('CTR-2023-077'),
                 due_date='2026-08-05', amount=390000, paid_amount=0,
                 remaining_amount=390000, status='EN_RETARD', penalty_amount=19500, days_overdue=21),
            dict(invoice_number='FAC-2026-07-008', period='Juillet 2026',
                 merchant=m('105/2016/BUJ'), place=p('MALL-N1-B05'), contract=c('CTR-2023-077'),
                 due_date='2026-07-05', amount=390000, paid_amount=0,
                 remaining_amount=390000, status='EN_RETARD', penalty_amount=19500, days_overdue=52),
        ]
        invoices = {}
        for d in data:
            num = d['invoice_number']
            inv, _ = DueDateInvoice.objects.get_or_create(invoice_number=num, defaults=d)
            invoices[num] = inv
        self.stdout.write('  ✓ Invoices')
        return invoices

    # ── Payments ──────────────────────────────────────────────────────────────

    def _seed_payments(self, merchants, invoices, users):
        from invoicing.models import Payment
        agent = users.get('agent@kamenge-mall.bi')
        data = [
            dict(merchant=merchants['110/2018/BUJ'],
                 invoice=invoices.get('FAC-2026-08-001'),
                 date=datetime.datetime(2026, 8, 2, 10, 15, tzinfo=datetime.timezone.utc),
                 amount=450000, method='Virement',
                 reference='VIR-BCB-987410', status='CONFIRME', recorded_by=agent),
            dict(merchant=merchants['115/2019/BUJ'],
                 invoice=invoices.get('FAC-2026-08-002'),
                 date=datetime.datetime(2026, 8, 4, 14, 0, tzinfo=datetime.timezone.utc),
                 amount=380000, method='Mobile Money',
                 reference='LUMICASH-554210', status='CONFIRME', recorded_by=agent),
            dict(merchant=merchants['133/2021/BUJ'],
                 invoice=None,
                 date=datetime.datetime(2026, 8, 3, 9, 30, tzinfo=datetime.timezone.utc),
                 amount=300000, method='Espèces',
                 reference='REC-MK-00245', status='CONFIRME', recorded_by=agent),
            dict(merchant=merchants['140/2022/BUJ'],
                 invoice=None,
                 date=datetime.datetime(2026, 8, 5, 11, 20, tzinfo=datetime.timezone.utc),
                 amount=150000, method='Mobile Money',
                 reference='ECOCASH-887412', status='CONFIRME', recorded_by=agent),
        ]
        for d in data:
            Payment.objects.get_or_create(reference=d['reference'], defaults=d)
        self.stdout.write('  ✓ Payments')

    # ── Payment Slips ─────────────────────────────────────────────────────────

    def _seed_payment_slips(self, merchants, places):
        from invoicing.models import PaymentSlip
        agent_name = 'Marie Nsabimana'
        data = [
            dict(slip_number='BOR-2026-08-014',
                 merchant=merchants['128/2020/BUJ'],
                 place=places['MALL-N1-A04'],
                 declared_amount=400000, expected_amount=400000,
                 method='Virement',
                 file='', file_name='Bordereau_Virement_Interbank_Belyse.pdf', file_size='1.2 MB',
                 status='EN_ATTENTE',
                 comment='Paiement effectué au guichet Interbank Bujumbura'),
            dict(slip_number='BOR-2026-08-011',
                 merchant=merchants['142/2023/BUJ'],
                 place=places['MALL-PKG-K01'],
                 declared_amount=220000, expected_amount=220000,
                 method='Mobile Money',
                 file='', file_name='Capture_Ecocash_Desire.png', file_size='450 KB',
                 status='APPROUVE',
                 comment='Numéro de transaction Ecocash vérifié avec le relevé bancaire'),
            dict(slip_number='BOR-2026-08-005',
                 merchant=merchants['120/2017/BUJ'],
                 place=places['MALL-N1-A03'],
                 declared_amount=300000, expected_amount=1575000,
                 method='Virement',
                 file='', file_name='Recu_Banque_Incomplet.pdf', file_size='890 KB',
                 status='REJETE',
                 rejection_reason='Montant versé partiel non conforme au décompte des arriérés'),
        ]
        for d in data:
            PaymentSlip.objects.get_or_create(slip_number=d['slip_number'], defaults=d)
        self.stdout.write('  ✓ Payment Slips')

    # ── Disputes ──────────────────────────────────────────────────────────────

    def _seed_disputes(self, merchants, places):
        from disputes.models import Dispute, ReminderHistoryItem
        data = [
            dict(merchant=merchants['098/2015/BUJ'], place=places['MALL-N1-A06'],
                 unpaid_months_count=5, base_rent_total=2000000, penalties_total=100000,
                 total_due=2100000, last_reminder_date='2026-08-15',
                 risk_level='CRITIQUE', status='Procédure Scellé'),
            dict(merchant=merchants['120/2017/BUJ'], place=places['MALL-N1-A03'],
                 unpaid_months_count=3, base_rent_total=1500000, penalties_total=75000,
                 total_due=1575000, last_reminder_date='2026-08-22',
                 risk_level='ELEVE', status='Mise en demeure'),
            dict(merchant=merchants['105/2016/BUJ'], place=places['MALL-N1-B05'],
                 unpaid_months_count=2, base_rent_total=780000, penalties_total=39000,
                 total_due=819000, last_reminder_date='2026-08-20',
                 risk_level='MOYEN', status='Relance J-5'),
        ]
        disputes = []
        for d in data:
            key = (d['merchant'].id, d['place'].id)
            dis, _ = Dispute.objects.get_or_create(
                merchant=d['merchant'], place=d['place'], defaults=d
            )
            disputes.append(dis)

        # Reminders for dispute #2 (Gérard Bizimana)
        if len(disputes) >= 2:
            gerard_dispute = disputes[1]
            reminders = [
                dict(dispute=gerard_dispute, type='Rappel J-5', channel='SMS',
                     destination='+257 71 555 666', status='Envoyé',
                     content='Mall Kamenge: Votre loyer du mois de Juillet 2026 est à payer avant le 15.'),
                dict(dispute=gerard_dispute, type='Retard fin de mois', channel='Email',
                     destination='gerard.bizimana@outlook.com', status='Envoyé',
                     content='AVIS DE RETARD: impayé cumulé – pénalité 5% appliquée.'),
                dict(dispute=gerard_dispute, type='Mise en demeure', channel='SMS',
                     destination='+257 71 555 666', status='Envoyé',
                     content='MISE EN DEMEURE ULTIME: soldez 1 575 000 BIF sous 48h.'),
            ]
            for r in reminders:
                if not ReminderHistoryItem.objects.filter(
                    dispute=r['dispute'], type=r['type'], channel=r['channel']
                ).exists():
                    ReminderHistoryItem.objects.create(**r)
        self.stdout.write('  ✓ Disputes + Reminders')

    # ── Accounting ────────────────────────────────────────────────────────────

    def _seed_accounting(self, users):
        from accounting.models import AccountingAccount, CostCenter, AccountingEntry, AccountingEntryLine
        accounts_data = [
            ('101000', 'Capital social Mall Kamenge', 1, 'Capitaux', 500000000),
            ('411100', 'Clients - Commerçants Locataires', 4, 'Tiers', 4494000),
            ('512100', 'Banque Commerciale du Burundi (BCB)', 5, 'Trésorerie', 148500000),
            ('512200', 'Banque Interbank Burundi (IBB)', 5, 'Trésorerie', 89000000),
            ('531100', 'Caisse Principale Mall', 5, 'Trésorerie', 12400000),
            ('706100', 'Produits des Loyers - Boutiques Bloc A', 7, 'Produits', 38400000),
            ('706200', 'Produits des Loyers - Kiosques & Stands', 7, 'Produits', 14200000),
            ('707100', 'Produits des Pénalités de Retard', 7, 'Produits', 1250000),
        ]
        accounts = {}
        for code, name, cls, cat, bal in accounts_data:
            acc, _ = AccountingAccount.objects.get_or_create(
                code=code, defaults=dict(name=name, account_class=cls, category=cat, balance=bal)
            )
            accounts[code] = acc

        cc_data = [
            ('CC-ADM', 'Administration Générale', 15000000, 4200000),
            ('CC-SEC', 'Sécurité & Gardiennage', 8000000, 3100000),
            ('CC-NET', 'Salubrité & Nettoyage', 6000000, 2400000),
            ('CC-MAINT', 'Maintenance & Électricité', 12000000, 6800000),
        ]
        for code, name, budget, spent in cc_data:
            CostCenter.objects.get_or_create(code=code, defaults=dict(name=name, budget=budget, spent=spent))

        # Seed one balanced accounting entry
        admin = users.get('admin@kamenge-mall.bi')
        if not AccountingEntry.objects.filter(entry_number='ECR-2026-08-001').exists():
            entry = AccountingEntry.objects.create(
                entry_number='ECR-2026-08-001',
                date=datetime.date(2026, 8, 1),
                document_ref='LOYERS-AUG-2026',
                label='Génération automatique des échéances de loyers août 2026',
                total_debit=4494000, total_credit=4494000,
                is_balanced=True, status='VALIDE',
                created_by=admin,
            )
            AccountingEntryLine.objects.create(
                entry=entry, account=accounts['411100'], debit=4494000, credit=0,
                comment='Échéances août',
            )
            AccountingEntryLine.objects.create(
                entry=entry, account=accounts['706100'], debit=0, credit=3270000,
                comment='Loyers boutiques',
            )
            AccountingEntryLine.objects.create(
                entry=entry, account=accounts['706200'], debit=0, credit=1224000,
                comment='Loyers kiosques',
            )
        self.stdout.write('  ✓ Accounting accounts, cost centers, entry')

    # ── Disbursements ─────────────────────────────────────────────────────────

    def _seed_disbursements(self, users):
        from accounting.models import DisbursementRequest, CostCenter
        agent = users.get('agent@kamenge-mall.bi')
        admin = users.get('admin@kamenge-mall.bi')
        cc_maint = CostCenter.objects.filter(code='CC-MAINT').first()
        cc_net = CostCenter.objects.filter(code='CC-NET').first()

        data = [
            dict(request_number='DEC-2026-08-005',
                 applicant=agent, cost_center=cc_maint,
                 amount=850000,
                 purpose='Achat d\'un disjoncteur général et câblage armoire électrique Bloc B',
                 status='Confirmé', validated_by=admin, confirmed_by=admin),
            dict(request_number='DEC-2026-08-002',
                 applicant=admin, cost_center=cc_net,
                 amount=1400000,
                 purpose='Fourniture mensuelle de produits désinfectants et contenants à déchets',
                 status='Écriture Générée',
                 validated_by=admin, confirmed_by=admin, approved_by=admin),
        ]
        for d in data:
            DisbursementRequest.objects.get_or_create(request_number=d['request_number'], defaults=d)
        self.stdout.write('  ✓ Disbursements')

    # ── Audit Logs ────────────────────────────────────────────────────────────

    def _seed_audit_logs(self, users):
        from audit.models import AuditLog
        admin = users.get('admin@kamenge-mall.bi')
        agent = users.get('agent@kamenge-mall.bi')
        data = [
            dict(user=admin, user_name='Jonson Ndayishimiye', user_role='ADMIN',
                 action='Procédure Scellé Déclenchée', resource='Emplacement MALL-N1-A06',
                 old_status='IMPAYE', new_status='SCELLE', level='CRITIQUE',
                 ip_address='197.239.12.44',
                 details='Impayé supérieur à 5 mois (2 100 000 BIF). Ordre de mission généré.'),
            dict(user=agent, user_name='Marc Nkurunziza', user_role='AGENT',
                 action='Bordereau Approuvé', resource='Bordereau BOR-2026-08-011',
                 old_status='EN_ATTENTE', new_status='APPROUVE', level='INFO',
                 ip_address='197.239.12.18',
                 details='Attestation de virement vérifiée avec le compte bancaire IBB.'),
        ]
        for d in data:
            if not AuditLog.objects.filter(action=d['action'], resource=d['resource']).exists():
                AuditLog.objects.create(**d)
        self.stdout.write('  ✓ Audit logs')

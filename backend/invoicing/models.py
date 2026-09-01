from django.db import models
from merchants.models import Merchant, Contract
from core.models import Place


class DueDateInvoice(models.Model):
    class Status(models.TextChoices):
        A_VENIR = 'A_VENIR', 'À venir'
        PAYEE = 'PAYEE', 'Payée'
        PARTIELLEMENT_PAYEE = 'PARTIELLEMENT_PAYEE', 'Partiellement payée'
        IMPAYEE = 'IMPAYEE', 'Impayée'
        EN_RETARD = 'EN_RETARD', 'En retard'

    invoice_number = models.CharField(max_length=40, unique=True)
    period = models.CharField(max_length=30, help_text='Ex: Août 2026')
    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name='invoices')
    contract = models.ForeignKey(
        Contract, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='invoices',
    )
    place = models.ForeignKey(Place, on_delete=models.PROTECT, related_name='invoices')
    due_date = models.DateField()
    amount = models.BigIntegerField(help_text='Montant de base en BIF')
    paid_amount = models.BigIntegerField(default=0)
    remaining_amount = models.BigIntegerField()
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.A_VENIR)
    penalty_amount = models.BigIntegerField(default=0, help_text='Pénalité 5% si en retard')
    days_overdue = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Échéance / Facture'
        verbose_name_plural = 'Échéances / Factures'
        ordering = ['-due_date']

    def __str__(self):
        return f'{self.invoice_number} – {self.merchant.full_name} ({self.status})'

    def save(self, *args, **kwargs):
        self.remaining_amount = self.amount - self.paid_amount
        super().save(*args, **kwargs)


class Payment(models.Model):
    class Method(models.TextChoices):
        VIREMENT = 'Virement', 'Virement bancaire'
        MOBILE_MONEY = 'Mobile Money', 'Mobile Money'
        ESPECES = 'Espèces', 'Espèces'

    class Status(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        CONFIRME = 'CONFIRME', 'Confirmé'
        REJETE = 'REJETE', 'Rejeté'

    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name='payments')
    invoice = models.ForeignKey(
        DueDateInvoice, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='payments',
    )
    date = models.DateTimeField()
    amount = models.BigIntegerField()
    method = models.CharField(max_length=15, choices=Method.choices)
    reference = models.CharField(max_length=80, help_text='Numéro de transaction / reçu')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.EN_ATTENTE)
    recorded_by = models.ForeignKey(
        'users.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='recorded_payments',
    )
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date']

    def __str__(self):
        return f'{self.reference} – {self.merchant.full_name} – {self.amount} BIF'


class PaymentSlip(models.Model):
    class Status(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        APPROUVE = 'APPROUVE', 'Approuvé'
        REJETE = 'REJETE', 'Rejeté'

    slip_number = models.CharField(max_length=40, unique=True)
    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name='payment_slips')
    place = models.ForeignKey(Place, on_delete=models.PROTECT, related_name='payment_slips')
    invoice = models.ForeignKey(
        DueDateInvoice, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='slips',
    )
    submission_date = models.DateTimeField(auto_now_add=True)
    declared_amount = models.BigIntegerField()
    expected_amount = models.BigIntegerField()
    method = models.CharField(max_length=15, choices=Payment.Method.choices)
    file = models.FileField(upload_to='payment_slips/')
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.EN_ATTENTE)
    verified_by = models.ForeignKey(
        'users.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='verified_slips',
    )
    verification_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    comment = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Bordereau de paiement'
        verbose_name_plural = 'Bordereaux de paiement'
        ordering = ['-submission_date']

    def __str__(self):
        return f'{self.slip_number} – {self.merchant.full_name} ({self.status})'

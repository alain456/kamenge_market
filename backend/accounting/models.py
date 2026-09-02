from django.db import models
from users.models import User


class AccountingAccount(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=150)
    account_class = models.PositiveSmallIntegerField(
        help_text='Classe comptable 1–7'
    )
    category = models.CharField(max_length=80)
    balance = models.BigIntegerField(default=0, help_text='Solde en BIF')

    class Meta:
        verbose_name = 'Compte comptable'
        verbose_name_plural = 'Comptes comptables'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'


class CostCenter(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    budget = models.BigIntegerField(default=0, help_text='Budget annuel en BIF')
    spent = models.BigIntegerField(default=0, help_text='Dépensé en BIF')

    class Meta:
        verbose_name = 'Centre de coût'
        verbose_name_plural = 'Centres de coût'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'

    @property
    def remaining_budget(self):
        return self.budget - self.spent


class AccountingEntry(models.Model):
    class Status(models.TextChoices):
        BROUILLON = 'BROUILLON', 'Brouillon'
        VALIDE = 'VALIDE', 'Validé'
        EXTOURNE = 'EXTOURNE', 'Extourné'

    entry_number = models.CharField(max_length=40, unique=True)
    date = models.DateField()
    document_ref = models.CharField(max_length=80, blank=True)
    label = models.CharField(max_length=255)
    total_debit = models.BigIntegerField(default=0)
    total_credit = models.BigIntegerField(default=0)
    is_balanced = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.BROUILLON)
    created_by = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name='accounting_entries'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Écriture comptable'
        verbose_name_plural = 'Écritures comptables'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.entry_number} – {self.label}'


class AccountingEntryLine(models.Model):
    entry = models.ForeignKey(AccountingEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(AccountingAccount, on_delete=models.PROTECT, related_name='entry_lines')
    cost_center = models.ForeignKey(
        CostCenter, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='entry_lines',
    )
    debit = models.BigIntegerField(default=0)
    credit = models.BigIntegerField(default=0)
    comment = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Ligne d\'écriture'
        verbose_name_plural = 'Lignes d\'écriture'

    def __str__(self):
        return f'{self.account.code} D:{self.debit} C:{self.credit}'


class DisbursementRequest(models.Model):
    class Status(models.TextChoices):
        BROUILLON = 'Brouillon', 'Brouillon'
        VALIDE = 'Validé', 'Validé'
        CONFIRME = 'Confirmé', 'Confirmé'
        APPROUVE = 'Approuvé', 'Approuvé'
        ECRITURE_GENEREE = 'Écriture Générée', 'Écriture Générée'
        REJETE = 'Rejeté', 'Rejeté'

    request_number = models.CharField(max_length=40, unique=True)
    applicant = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='disbursement_requests'
    )
    cost_center = models.ForeignKey(
        CostCenter, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='disbursements',
    )
    amount = models.BigIntegerField(help_text='Montant demandé en BIF')
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BROUILLON)
    validated_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='validated_disbursements',
    )
    confirmed_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='confirmed_disbursements',
    )
    approved_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='approved_disbursements',
    )
    rejection_reason = models.TextField(blank=True)
    linked_entry = models.ForeignKey(
        AccountingEntry, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='disbursements',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Demande de décaissement'
        verbose_name_plural = 'Demandes de décaissement'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.request_number} – {self.applicant.name} ({self.status})'

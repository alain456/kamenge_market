from django.db import models
from users.models import User


class Merchant(models.Model):
    class Status(models.TextChoices):
        ACTIF = 'ACTIF', 'Actif'
        EN_LITIGE = 'EN_LITIGE', 'En litige'
        INACTIF = 'INACTIF', 'Inactif'

    # Optionally linked to a User account (MERCHANT role)
    user = models.OneToOneField(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='merchant_profile',
    )
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    identity_card_number = models.CharField(max_length=50, unique=True)
    photo = models.ImageField(upload_to='merchants/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIF)
    amount_due = models.BigIntegerField(default=0, help_text='Arriérés totaux en BIF')
    registered_at = models.DateField(auto_now_add=True)
    last_activity = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Commerçant'
        verbose_name_plural = 'Commerçants'
        ordering = ['full_name']

    def __str__(self):
        return self.full_name

    @property
    def assigned_place(self):
        """Returns the currently active place (via active contract)."""
        contract = self.contracts.filter(status=Contract.Status.ACTIF).first()
        return contract.place if contract else None


class Contract(models.Model):
    class Status(models.TextChoices):
        ACTIF = 'ACTIF', 'Actif'
        RESILIE = 'RESILIE', 'Résilié'
        EN_LITIGE = 'EN_LITIGE', 'En litige'

    class Periodicity(models.TextChoices):
        MENSUEL = 'Mensuel', 'Mensuel'
        TRIMESTRIEL = 'Trimestriel', 'Trimestriel'
        ANNUEL = 'Annuel', 'Annuel'

    code = models.CharField(max_length=30, unique=True)
    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name='contracts')
    place = models.ForeignKey('core.Place', on_delete=models.PROTECT, related_name='contracts')
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.BigIntegerField(help_text='Loyer mensuel en BIF')
    deposit_months = models.PositiveSmallIntegerField(default=2)
    deposit_amount = models.BigIntegerField(help_text='Caution = deposit_months × monthly_rent')
    periodicity = models.CharField(max_length=15, choices=Periodicity.choices, default=Periodicity.MENSUEL)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIF)
    sublease_allowed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Contrat'
        verbose_name_plural = 'Contrats'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} – {self.merchant.full_name}'

    def save(self, *args, **kwargs):
        # Auto-compute deposit if not set
        if not self.deposit_amount:
            self.deposit_amount = self.deposit_months * self.monthly_rent
        super().save(*args, **kwargs)

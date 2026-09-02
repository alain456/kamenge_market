from django.db import models


class Zone(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    total_places = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Zone'
        verbose_name_plural = 'Zones'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'


class Place(models.Model):
    class Type(models.TextChoices):
        BOUTIQUE = 'Boutique', 'Boutique'
        KIOSQUE = 'Kiosque', 'Kiosque'
        STAND = 'Stand', 'Stand'

    class Status(models.TextChoices):
        LIBRE = 'LIBRE', 'Libre'
        OCCUPE = 'OCCUPE', 'Occupé'
        PREUVE_EN_ATTENTE = 'PREUVE_EN_ATTENTE', 'Preuve en attente'
        IMPAYE = 'IMPAYE', 'Impayé'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        SCELLE = 'SCELLE', 'Scellé'

    code = models.CharField(max_length=30, unique=True)
    zone = models.ForeignKey(Zone, on_delete=models.PROTECT, related_name='places')
    type = models.CharField(max_length=10, choices=Type.choices)
    surface_m2 = models.DecimalField(max_digits=8, decimal_places=2)
    monthly_rent = models.BigIntegerField(help_text='Loyer mensuel en BIF')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.LIBRE)

    # Denormalized current occupant — updated by contract / payment workflows
    current_merchant = models.ForeignKey(
        'merchants.Merchant',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='occupied_places',
    )
    current_contract = models.ForeignKey(
        'merchants.Contract',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
    )
    last_due_date = models.DateField(null=True, blank=True)
    total_due = models.BigIntegerField(default=0, help_text='Arriérés cumulés en BIF')
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Emplacement'
        verbose_name_plural = 'Emplacements'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} ({self.get_status_display()})'

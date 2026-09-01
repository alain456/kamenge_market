from django.db import models
from merchants.models import Merchant
from core.models import Place


class Dispute(models.Model):
    class RiskLevel(models.TextChoices):
        FAIBLE = 'FAIBLE', 'Faible'
        MOYEN = 'MOYEN', 'Moyen'
        ELEVE = 'ELEVE', 'Élevé'
        CRITIQUE = 'CRITIQUE', 'Critique'

    class Status(models.TextChoices):
        OUVERT = 'Dossier Ouvert', 'Dossier Ouvert'
        RELANCE = 'Relance J-5', 'Relance J-5'
        MISE_EN_DEMEURE = 'Mise en demeure', 'Mise en demeure'
        PROCEDURE_SCELLE = 'Procédure Scellé', 'Procédure Scellé'
        REGULARISE = 'Régularisé', 'Régularisé'

    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name='disputes')
    place = models.ForeignKey(Place, on_delete=models.PROTECT, related_name='disputes')
    unpaid_months_count = models.PositiveSmallIntegerField(default=0)
    base_rent_total = models.BigIntegerField(default=0)
    penalties_total = models.BigIntegerField(default=0)
    total_due = models.BigIntegerField(default=0)
    last_reminder_date = models.DateField(null=True, blank=True)
    risk_level = models.CharField(max_length=10, choices=RiskLevel.choices, default=RiskLevel.FAIBLE)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.OUVERT)
    opened_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Contentieux'
        verbose_name_plural = 'Contentieux'
        ordering = ['-total_due']

    def __str__(self):
        return f'Litige {self.merchant.full_name} – {self.place.code} ({self.status})'

    def save(self, *args, **kwargs):
        self.total_due = self.base_rent_total + self.penalties_total
        super().save(*args, **kwargs)


class ReminderHistoryItem(models.Model):
    class Type(models.TextChoices):
        RAPPEL_J5 = 'Rappel J-5', 'Rappel J-5'
        RETARD_FIN_MOIS = 'Retard fin de mois', 'Retard fin de mois'
        MISE_EN_DEMEURE = 'Mise en demeure', 'Mise en demeure'
        MANUEL = 'Manuel', 'Manuel'

    class Channel(models.TextChoices):
        SMS = 'SMS', 'SMS'
        EMAIL = 'Email', 'Email'

    class Status(models.TextChoices):
        ENVOYE = 'Envoyé', 'Envoyé'
        ECHEC = 'Échec', 'Échec'

    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='reminders')
    type = models.CharField(max_length=25, choices=Type.choices)
    channel = models.CharField(max_length=5, choices=Channel.choices)
    destination = models.CharField(max_length=100, help_text='Numéro ou adresse e-mail')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ENVOYE)
    sent_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField()

    class Meta:
        verbose_name = 'Historique relance'
        verbose_name_plural = 'Historiques relances'
        ordering = ['-sent_at']

    def __str__(self):
        return f'{self.type} – {self.dispute.merchant.full_name} ({self.sent_at:%d/%m/%Y})'

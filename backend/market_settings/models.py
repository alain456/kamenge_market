from django.db import models


class MarketSettings(models.Model):
    """
    Singleton model — only one row should ever exist.
    Use MarketSettings.get_solo() to retrieve it.
    """
    name = models.CharField(max_length=100, default='Mall Kamenge')
    city = models.CharField(max_length=100, default='Bujumbura, Burundi')
    currency = models.CharField(max_length=10, default='BIF')
    penalty_rate_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.00,
        help_text='Taux de pénalité de retard (%)'
    )
    billing_day_of_month = models.PositiveSmallIntegerField(
        default=1,
        help_text='Jour de génération des échéances (1–28)'
    )
    grace_period_days = models.PositiveSmallIntegerField(
        default=5,
        help_text='Nombre de jours de grâce avant pénalité'
    )
    decimal_precision = models.PositiveSmallIntegerField(default=0)
    sms_notifications_enabled = models.BooleanField(default=True)
    email_notifications_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paramètres du marché'
        verbose_name_plural = 'Paramètres du marché'

    def __str__(self):
        return f'Paramètres – {self.name}'

    @classmethod
    def get_solo(cls):
        """Always returns the single settings instance, creating it if absent."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def save(self, *args, **kwargs):
        self.pk = 1  # enforce singleton
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass  # prevent deletion

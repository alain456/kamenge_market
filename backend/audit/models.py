from django.db import models
from users.models import User, Role


class AuditLog(models.Model):
    class Level(models.TextChoices):
        INFO = 'INFO', 'Info'
        ALERTE = 'ALERTE', 'Alerte'
        CRITIQUE = 'CRITIQUE', 'Critique'

    user = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
    )
    user_name = models.CharField(max_length=150, blank=True, help_text='Snapshot at time of action')
    user_role = models.CharField(max_length=10, choices=Role.choices, blank=True)
    action = models.CharField(max_length=255)
    resource = models.CharField(max_length=255)
    old_status = models.CharField(max_length=100, blank=True)
    new_status = models.CharField(max_length=100, blank=True)
    details = models.TextField(blank=True)
    level = models.CharField(max_length=10, choices=Level.choices, default=Level.INFO)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Journal d\'audit'
        verbose_name_plural = 'Journal d\'audit'
        ordering = ['-timestamp']

    def __str__(self):
        return f'[{self.level}] {self.action} – {self.resource} ({self.timestamp:%d/%m/%Y %H:%M})'

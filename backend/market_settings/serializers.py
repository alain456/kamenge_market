from rest_framework import serializers
from .models import MarketSettings


class MarketSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketSettings
        fields = [
            'name', 'city', 'currency',
            'penalty_rate_percent', 'billing_day_of_month',
            'grace_period_days', 'decimal_precision',
            'sms_notifications_enabled', 'email_notifications_enabled',
            'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate_billing_day_of_month(self, value):
        if not (1 <= value <= 28):
            raise serializers.ValidationError('Le jour de facturation doit être entre 1 et 28.')
        return value

    def validate_penalty_rate_percent(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError('Le taux de pénalité doit être entre 0 et 100.')
        return value

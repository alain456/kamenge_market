from rest_framework import serializers
from .models import Dispute, ReminderHistoryItem


class ReminderHistoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderHistoryItem
        fields = [
            'id', 'dispute', 'type', 'channel',
            'destination', 'status', 'sent_at', 'content',
        ]
        read_only_fields = ['id', 'sent_at']


class DisputeSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.full_name', read_only=True)
    merchant_phone = serializers.CharField(source='merchant.phone', read_only=True)
    place_code = serializers.CharField(source='place.code', read_only=True)
    reminders = ReminderHistoryItemSerializer(many=True, read_only=True)

    class Meta:
        model = Dispute
        fields = [
            'id', 'merchant', 'merchant_name', 'merchant_phone',
            'place', 'place_code',
            'unpaid_months_count', 'base_rent_total',
            'penalties_total', 'total_due',
            'last_reminder_date', 'risk_level', 'status',
            'admin_notes', 'opened_at', 'updated_at',
            'reminders',
        ]
        read_only_fields = ['id', 'total_due', 'opened_at', 'updated_at']


class DisputeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = [
            'merchant', 'place',
            'unpaid_months_count', 'base_rent_total', 'penalties_total',
            'risk_level', 'status', 'admin_notes',
        ]


class SealProcedureSerializer(serializers.Serializer):
    """Body for POST /api/disputes/<pk>/seal/"""
    admin_notes = serializers.CharField(min_length=10, help_text='Justification obligatoire (min 10 caractères)')


class AddReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderHistoryItem
        fields = ['type', 'channel', 'destination', 'content']

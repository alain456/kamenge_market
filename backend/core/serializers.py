from rest_framework import serializers
from .models import Zone, Place


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ['id', 'code', 'name', 'description', 'total_places']


class PlaceSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    current_merchant_name = serializers.CharField(
        source='current_merchant.full_name', read_only=True, default=None
    )

    class Meta:
        model = Place
        fields = [
            'id', 'code', 'zone', 'zone_name', 'type',
            'surface_m2', 'monthly_rent', 'status',
            'current_merchant', 'current_merchant_name',
            'current_contract', 'last_due_date',
            'total_due', 'notes',
        ]
        read_only_fields = [
            'current_merchant', 'current_contract',
            'last_due_date', 'total_due',
        ]


class PlaceStatusUpdateSerializer(serializers.ModelSerializer):
    """Used for the admin status-change action."""
    class Meta:
        model = Place
        fields = ['status', 'notes']

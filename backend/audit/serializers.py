from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'user_role',
            'action', 'resource',
            'old_status', 'new_status',
            'details', 'level', 'ip_address', 'timestamp',
        ]
        read_only_fields = fields  # audit log is always read-only via API

from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from users.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit-logs/
    Read-only. Admins only. Supports search, filter by level/user_role,
    and ordering by timestamp.
    """
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['level', 'user_role', 'user']
    search_fields = ['action', 'resource', 'user_name', 'details']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

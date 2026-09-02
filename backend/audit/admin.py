from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'level', 'user_name', 'user_role', 'action', 'resource', 'ip_address']
    list_filter = ['level', 'user_role']
    search_fields = ['action', 'resource', 'user_name', 'details']
    readonly_fields = [f.name for f in AuditLog._meta.fields]  # fully read-only in admin

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

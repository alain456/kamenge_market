from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StaffRole


@admin.register(StaffRole)
class StaffRoleAdmin(admin.ModelAdmin):
    list_display = ['slug', 'name', 'is_system_role']
    search_fields = ['slug', 'name']
    readonly_fields = ['is_system_role']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'staff_role', 'role', 'status', 'is_staff']
    list_filter = ['staff_role', 'role', 'status', 'is_staff']
    search_fields = ['email', 'name']
    ordering = ['name']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('name', 'phone', 'avatar', 'assigned_area')}),
        ('Rôle & Statut', {'fields': ('staff_role', 'role', 'status')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login_at', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'staff_role', 'role', 'password1', 'password2'),
        }),
    )
    readonly_fields = ['last_login_at', 'date_joined']

from django.contrib import admin
from .models import MarketSettings


@admin.register(MarketSettings)
class MarketSettingsAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'currency', 'penalty_rate_percent', 'billing_day_of_month']
    readonly_fields = ['updated_at']

    def has_add_permission(self, request):
        # Only allow one instance
        return not MarketSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

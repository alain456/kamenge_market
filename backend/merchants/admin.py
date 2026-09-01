from django.contrib import admin
from .models import Merchant, Contract


@admin.register(Merchant)
class MerchantAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'email', 'status', 'amount_due', 'registered_at']
    list_filter = ['status']
    search_fields = ['full_name', 'email', 'phone', 'identity_card_number']
    readonly_fields = ['registered_at', 'last_activity']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['code', 'merchant', 'place', 'start_date', 'end_date', 'monthly_rent', 'status']
    list_filter = ['status', 'periodicity']
    search_fields = ['code', 'merchant__full_name', 'place__code']
    autocomplete_fields = ['merchant', 'place']
    readonly_fields = ['code', 'deposit_amount', 'created_at']

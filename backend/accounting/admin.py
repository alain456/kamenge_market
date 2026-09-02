from django.contrib import admin
from .models import AccountingAccount, CostCenter, AccountingEntry, AccountingEntryLine, DisbursementRequest


@admin.register(AccountingAccount)
class AccountingAccountAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'account_class', 'category', 'balance']
    list_filter = ['account_class', 'category']
    search_fields = ['code', 'name']


@admin.register(CostCenter)
class CostCenterAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'budget', 'spent', 'remaining_budget']
    search_fields = ['code', 'name']
    readonly_fields = ['remaining_budget']


class EntryLineInline(admin.TabularInline):
    model = AccountingEntryLine
    extra = 0
    autocomplete_fields = ['account']


@admin.register(AccountingEntry)
class AccountingEntryAdmin(admin.ModelAdmin):
    list_display = ['entry_number', 'date', 'label', 'total_debit', 'total_credit', 'is_balanced', 'status']
    list_filter = ['status']
    search_fields = ['entry_number', 'label', 'document_ref']
    readonly_fields = ['is_balanced', 'created_at']
    inlines = [EntryLineInline]


@admin.register(DisbursementRequest)
class DisbursementRequestAdmin(admin.ModelAdmin):
    list_display = ['request_number', 'applicant', 'cost_center', 'amount', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['request_number', 'applicant__name', 'purpose']
    readonly_fields = ['request_number', 'created_at', 'updated_at']

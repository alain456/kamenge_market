from django.contrib import admin
from .models import DueDateInvoice, Payment, PaymentSlip


@admin.register(DueDateInvoice)
class DueDateInvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'period', 'merchant', 'place',
        'due_date', 'amount', 'paid_amount', 'remaining_amount', 'status',
    ]
    list_filter = ['status', 'period']
    search_fields = ['invoice_number', 'merchant__full_name', 'place__code']
    readonly_fields = ['created_at', 'updated_at', 'remaining_amount']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['reference', 'merchant', 'amount', 'method', 'status', 'date']
    list_filter = ['status', 'method']
    search_fields = ['reference', 'merchant__full_name']
    readonly_fields = ['created_at']


@admin.register(PaymentSlip)
class PaymentSlipAdmin(admin.ModelAdmin):
    list_display = [
        'slip_number', 'merchant', 'place',
        'declared_amount', 'expected_amount', 'status', 'submission_date',
    ]
    list_filter = ['status', 'method']
    search_fields = ['slip_number', 'merchant__full_name', 'place__code']
    readonly_fields = ['submission_date', 'verification_date']

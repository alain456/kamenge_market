from django.contrib import admin
from .models import Dispute, ReminderHistoryItem


class ReminderInline(admin.TabularInline):
    model = ReminderHistoryItem
    extra = 0
    readonly_fields = ['sent_at']


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['merchant', 'place', 'total_due', 'risk_level', 'status', 'opened_at']
    list_filter = ['status', 'risk_level']
    search_fields = ['merchant__full_name', 'place__code']
    readonly_fields = ['opened_at', 'updated_at', 'total_due']
    inlines = [ReminderInline]


@admin.register(ReminderHistoryItem)
class ReminderHistoryItemAdmin(admin.ModelAdmin):
    list_display = ['dispute', 'type', 'channel', 'destination', 'status', 'sent_at']
    list_filter = ['type', 'channel', 'status']
    readonly_fields = ['sent_at']

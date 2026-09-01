from django.contrib import admin
from .models import Zone, Place


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'total_places']
    search_fields = ['code', 'name']


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ['code', 'zone', 'type', 'surface_m2', 'monthly_rent', 'status']
    list_filter = ['status', 'type', 'zone']
    search_fields = ['code', 'notes']
    autocomplete_fields = ['zone']

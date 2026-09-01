from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # All API endpoints under /api/
    path('api/', include([
        # Auth + Users
        path('', include('users.urls')),

        # Core: Zones + Places
        path('', include('core.urls')),

        # Merchants + Contracts
        path('', include('merchants.urls')),

        # Invoicing: Due-dates, Payments, Payment Slips
        path('', include('invoicing.urls')),

        # Disputes + Seal + Reminders
        path('', include('disputes.urls')),

        # Accounting: Accounts, Entries, Cost Centers, Disbursements
        path('', include('accounting.urls')),

        # Audit Log
        path('', include('audit.urls')),

        # Market Settings (singleton)
        path('', include('market_settings.urls')),

        # Reports
        path('', include('kamenge_backend.reports_urls')),
    ])),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

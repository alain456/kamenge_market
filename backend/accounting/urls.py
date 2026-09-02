from django.urls import path
from . import views

urlpatterns = [
    # Accounts
    path('accounting/accounts/', views.AccountListView.as_view(), name='account_list'),
    path('accounting/accounts/<int:pk>/', views.AccountDetailView.as_view(), name='account_detail'),

    # Cost centers
    path('accounting/cost-centers/', views.CostCenterListView.as_view(), name='cost_center_list'),
    path('accounting/cost-centers/<int:pk>/', views.CostCenterDetailView.as_view(), name='cost_center_detail'),

    # Accounting entries
    path('accounting/entries/', views.AccountingEntryListView.as_view(), name='entry_list'),
    path('accounting/entries/create/', views.create_accounting_entry, name='entry_create'),
    path('accounting/entries/<int:pk>/', views.AccountingEntryDetailView.as_view(), name='entry_detail'),

    # Disbursements
    path('disbursements/', views.DisbursementListCreateView.as_view(), name='disbursement_list_create'),
    path('disbursements/<int:pk>/', views.DisbursementDetailView.as_view(), name='disbursement_detail'),
    path('disbursements/<int:pk>/advance/', views.advance_disbursement, name='disbursement_advance'),
    path('disbursements/<int:pk>/reject/', views.reject_disbursement, name='disbursement_reject'),
]

from django.urls import path
from . import views

urlpatterns = [
    # Due-date invoices
    path('due-dates/', views.DueDateInvoiceListView.as_view(), name='due_date_list'),
    path('due-dates/<int:pk>/', views.DueDateInvoiceDetailView.as_view(), name='due_date_detail'),
    path('due-dates/generate/', views.generate_monthly_due_dates, name='due_date_generate'),

    # Payments
    path('payments/', views.PaymentListCreateView.as_view(), name='payment_list_create'),
    path('payments/<int:pk>/confirm/', views.confirm_payment, name='payment_confirm'),

    # Payment slips
    path('payment-slips/', views.PaymentSlipListCreateView.as_view(), name='slip_list_create'),
    path('payment-slips/<int:pk>/', views.PaymentSlipDetailView.as_view(), name='slip_detail'),
    path('payment-slips/<int:pk>/verify/', views.verify_payment_slip, name='slip_verify'),
]

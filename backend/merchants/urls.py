from django.urls import path
from . import views

urlpatterns = [
    path('merchants/', views.MerchantListCreateView.as_view(), name='merchant_list_create'),
    path('merchants/<int:pk>/', views.MerchantDetailView.as_view(), name='merchant_detail'),
    path('merchants/<int:pk>/contracts/', views.MerchantContractsView.as_view(), name='merchant_contracts'),

    path('contracts/', views.ContractListCreateView.as_view(), name='contract_list_create'),
    path('contracts/<int:pk>/', views.ContractDetailView.as_view(), name='contract_detail'),
    path('contracts/<int:pk>/terminate/', views.terminate_contract, name='contract_terminate'),
]

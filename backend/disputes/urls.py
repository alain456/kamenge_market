from django.urls import path
from . import views

urlpatterns = [
    path('disputes/', views.DisputeListCreateView.as_view(), name='dispute_list_create'),
    path('disputes/<int:pk>/', views.DisputeDetailView.as_view(), name='dispute_detail'),
    path('disputes/<int:pk>/seal/', views.trigger_seal_procedure, name='dispute_seal'),
    path('disputes/<int:pk>/reminders/', views.add_reminder, name='dispute_add_reminder'),
    path('disputes/<int:pk>/regularize/', views.regularize_dispute, name='dispute_regularize'),
]

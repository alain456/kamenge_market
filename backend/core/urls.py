from django.urls import path
from . import views

urlpatterns = [
    path('zones/', views.ZoneListCreateView.as_view(), name='zone_list_create'),
    path('zones/<int:pk>/', views.ZoneDetailView.as_view(), name='zone_detail'),

    path('places/', views.PlaceListCreateView.as_view(), name='place_list_create'),
    path('places/<int:pk>/', views.PlaceDetailView.as_view(), name='place_detail'),
    path('places/<int:pk>/status/', views.place_change_status, name='place_change_status'),
]

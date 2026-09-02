from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),
    path('auth/change-password/', views.change_password_view, name='change_password'),

    # User management
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),

    # Staff roles (dynamic RBAC)
    path('roles/', views.StaffRoleListCreateView.as_view(), name='role_list_create'),
    path('roles/<slug:slug>/', views.StaffRoleDetailView.as_view(), name='role_detail'),
]

from django.urls import path
from . import reports_views

urlpatterns = [
    path('reports/revenue/', reports_views.revenue_report, name='report_revenue'),
    path('reports/dashboard/', reports_views.dashboard_stats, name='report_dashboard'),
    path('reports/my-tasks/', reports_views.my_tasks, name='report_my_tasks'),
]

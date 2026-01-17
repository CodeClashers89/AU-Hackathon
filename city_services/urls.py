from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('categories', views.ComplaintCategoryViewSet, basename='complaint-category')
router.register('complaints', views.ComplaintViewSet, basename='complaint')
router.register('responses', views.ComplaintResponseViewSet, basename='complaint-response')

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard-stats'),
    path('', include(router.urls)),
]

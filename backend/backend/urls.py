from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from buysense.views import CreateUserView, CreateCustomerView, CreateSellerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('buysense/user/register/', CreateUserView.as_view(),    name='register'),
    path('buysense/token/',         TokenObtainPairView.as_view(), name='get_token'),
    path('buysense/token/refresh/', TokenRefreshView.as_view(),  name='refresh'),
    path('buysense-auth/',          include('rest_framework.urls')),

    # Profiles  ← new
    path('api/customers/', CreateCustomerView.as_view(), name='create_customer'),
    path('api/sellers/',   CreateSellerView.as_view(),   name='create_seller'),
]
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from buysense.views import (
    # Auth
    CreateUserView, CreateCustomerView, CreateSellerView, MeView,
    # Catalogue
    CategoryListView, ProductListView, ProductDetailView,
    ProductReviewListCreateView,
    # Seller products
    SellerProductListCreateView, SellerProductDetailView,
    # Cart
    CartListCreateView, CartItemDetailView, CartClearView, CartSummaryView,
    # Orders
    OrderListCreateView, OrderDetailView, OrderStatusUpdateView,
    # Payments
    PaymentCreateView, PaymentDetailView,
    # Analytics
    AnalyticsSalesTrendView, AnalyticsTopProductsView,
    AnalyticsRevenueByCityView, AnalyticsCategoryPerformanceView,
    AnalyticsSellerDashboardView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ──────────────────────────────────────────────────────
    path('buysense/user/register/',  CreateUserView.as_view(),      name='register'),
    path('buysense/token/',          TokenObtainPairView.as_view(),  name='get_token'),
    path('buysense/token/refresh/',  TokenRefreshView.as_view(),     name='refresh'),
    path('buysense-auth/',           include('rest_framework.urls')),

    # ── Profiles ──────────────────────────────────────────────────
    path('api/customers/',           CreateCustomerView.as_view(),   name='create_customer'),
    path('api/sellers/',             CreateSellerView.as_view(),     name='create_seller'),
    path('api/me/',                  MeView.as_view(),               name='me'),

    # ── Catalogue (public) ────────────────────────────────────────
    path('api/categories/',          CategoryListView.as_view(),     name='category_list'),
    path('api/products/',            ProductListView.as_view(),      name='product_list'),
    path('api/products/<int:pk>/',   ProductDetailView.as_view(),    name='product_detail'),
    path('api/products/<int:pk>/reviews/', ProductReviewListCreateView.as_view(), name='product_reviews'),

    # ── Seller: products ──────────────────────────────────────────
    path('api/seller/products/',             SellerProductListCreateView.as_view(), name='seller_products'),
    path('api/seller/products/<int:pk>/',    SellerProductDetailView.as_view(),     name='seller_product_detail'),

    # ── Cart ──────────────────────────────────────────────────────
    path('api/cart/',                CartListCreateView.as_view(),   name='cart'),
    path('api/cart/summary/',        CartSummaryView.as_view(),      name='cart_summary'),
    path('api/cart/clear/',          CartClearView.as_view(),        name='cart_clear'),
    path('api/cart/<int:pk>/',       CartItemDetailView.as_view(),   name='cart_item'),

    # ── Orders ────────────────────────────────────────────────────
    path('api/orders/',              OrderListCreateView.as_view(),  name='orders'),
    path('api/orders/<int:pk>/',     OrderDetailView.as_view(),      name='order_detail'),
    path('api/seller/orders/<int:pk>/status/', OrderStatusUpdateView.as_view(), name='order_status'),

    # ── Payments ──────────────────────────────────────────────────
    path('api/payments/',            PaymentCreateView.as_view(),    name='payment_create'),
    path('api/payments/<int:pk>/',   PaymentDetailView.as_view(),    name='payment_detail'),

    # ── Analytics (seller only) ───────────────────────────────────
    path('api/analytics/sales-trend/',          AnalyticsSalesTrendView.as_view(),          name='analytics_sales'),
    path('api/analytics/top-products/',         AnalyticsTopProductsView.as_view(),         name='analytics_top_products'),
    path('api/analytics/revenue-by-city/',      AnalyticsRevenueByCityView.as_view(),       name='analytics_city'),
    path('api/analytics/category-performance/', AnalyticsCategoryPerformanceView.as_view(), name='analytics_category'),
    path('api/analytics/seller-dashboard/',     AnalyticsSellerDashboardView.as_view(),     name='analytics_seller'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
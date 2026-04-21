from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncMonth, TruncDay
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import (
    Customer, Seller, Category, Product,
    CartItem, Order, OrderItem, Payment, Review, OrderStatus
)
from .serializers import (
    UserSerializer, CustomerSerializer, SellerSerializer,
    CategorySerializer, ProductSerializer, ReviewSerializer,
    CartItemSerializer, OrderSerializer, OrderStatusUpdateSerializer,
    PaymentSerializer
)

User = get_user_model()


# ── Helpers ──────────────────────────────────────────────────────

def get_customer(user):
    try:
        return Customer.objects.get(user=user)
    except Customer.DoesNotExist:
        raise PermissionDenied("Customer profile required.")


def get_seller(user):
    try:
        return Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        raise PermissionDenied("Seller profile required.")


# ── Auth ─────────────────────────────────────────────────────────

class CreateUserView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = UserSerializer
    permission_classes = [AllowAny]


class CreateCustomerView(generics.CreateAPIView):
    serializer_class   = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if Customer.objects.filter(user=self.request.user).exists():
            raise PermissionDenied("Customer profile already exists.")
        serializer.save(user=self.request.user)


class CreateSellerView(generics.CreateAPIView):
    serializer_class   = SellerSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if Seller.objects.filter(user=self.request.user).exists():
            raise PermissionDenied("Seller profile already exists.")
        serializer.save(user=self.request.user)


# ── Me (current user profile) ────────────────────────────────────

class MeView(APIView):
    """GET /api/me/ — returns current user + role flags"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        data['is_customer'] = Customer.objects.filter(user=user).exists()
        data['is_seller']   = Seller.objects.filter(user=user).exists()
        return Response(data)


# ── Categories ───────────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    queryset           = Category.objects.all()
    serializer_class   = CategorySerializer
    permission_classes = [AllowAny]


# ── Products (public) ────────────────────────────────────────────

class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    Params: ?category=<id> ?seller=<id> ?search=<str>
            ?ordering=price_asc|price_desc|newest|top_rated
    """
    serializer_class   = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs       = Product.objects.select_related('category', 'seller__user').prefetch_related('reviews')
        params   = self.request.query_params

        category = params.get('category')
        seller   = params.get('seller')
        search   = params.get('search')
        ordering = params.get('ordering', 'newest')

        if category:
            qs = qs.filter(category__id=category)
        if seller:
            qs = qs.filter(seller__id=seller)
        if search:
            qs = qs.filter(product_name__icontains=search)

        if ordering == 'price_asc':
            qs = qs.order_by('product_price')
        elif ordering == 'price_desc':
            qs = qs.order_by('-product_price')
        elif ordering == 'top_rated':
            qs = qs.annotate(avg=Avg('reviews__rating')).order_by('-avg')
        else:
            qs = qs.order_by('-created_at')

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    queryset           = Product.objects.select_related('category', 'seller__user').prefetch_related('reviews')
    serializer_class   = ProductSerializer
    permission_classes = [AllowAny]


# ── Products (seller-only) ───────────────────────────────────────

class SellerProductListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/seller/products/"""
    serializer_class   = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        seller = get_seller(self.request.user)
        return Product.objects.filter(seller=seller).select_related('category').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(seller=get_seller(self.request.user))


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/seller/products/<id>/"""
    serializer_class   = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(seller=get_seller(self.request.user))


# ── Reviews ──────────────────────────────────────────────────────

class ProductReviewListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/products/<pk>/reviews/"""
    serializer_class   = ReviewSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs['pk']).select_related('customer__user')

    def perform_create(self, serializer):
        customer = get_customer(self.request.user)
        product  = Product.objects.get(pk=self.kwargs['pk'])
        if Review.objects.filter(product=product, customer=customer).exists():
            raise ValidationError("You have already reviewed this product.")
        serializer.save(product=product, customer=customer)


# ── Cart ─────────────────────────────────────────────────────────

class CartListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/cart/  — view my cart
    POST /api/cart/  — add item (or increment if already exists)
    """
    serializer_class   = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related('product__category', 'product__seller')

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        quantity   = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=404)

        if product.stock_quantity < quantity:
            return Response({'error': 'Insufficient stock.'}, status=400)

        item, created = CartItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()

        serializer = self.get_serializer(item)
        return Response(serializer.data, status=201 if created else 200)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    PATCH  /api/cart/<id>/  — update quantity
    DELETE /api/cart/<id>/  — remove item
    """
    serializer_class   = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)


class CartClearView(APIView):
    """DELETE /api/cart/clear/ — wipe entire cart"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        CartItem.objects.filter(user=request.user).delete()
        return Response({'message': 'Cart cleared.'}, status=204)


class CartSummaryView(APIView):
    """GET /api/cart/summary/ — total items + total price"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = CartItem.objects.filter(user=request.user).select_related('product')
        total_items = sum(i.quantity for i in items)
        total_price = sum(float(i.product.product_price) * i.quantity for i in items)
        return Response({
            'total_items': total_items,
            'total_price': round(total_price, 2),
        })


# ── Orders ───────────────────────────────────────────────────────

class OrderListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/orders/  — my order history
    POST /api/orders/  — place new order
    """
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = get_customer(self.request.user)
        return Order.objects.filter(customer=customer).prefetch_related('items__product').order_by('-created_at')

    def perform_create(self, serializer):
        customer = get_customer(self.request.user)
        serializer.save(customer=customer)


class OrderDetailView(generics.RetrieveAPIView):
    """GET /api/orders/<id>/ — single order detail"""
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = get_customer(self.request.user)
        return Order.objects.filter(customer=customer).prefetch_related('items__product')


class OrderStatusUpdateView(generics.UpdateAPIView):
    """PATCH /api/seller/orders/<id>/status/ — seller updates order status"""
    serializer_class   = OrderStatusUpdateSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ['patch']

    def get_queryset(self):
        seller = get_seller(self.request.user)
        # Sellers can only update orders containing their products
        return Order.objects.filter(items__product__seller=seller).distinct()


# ── Payments ─────────────────────────────────────────────────────

class PaymentCreateView(generics.CreateAPIView):
    """POST /api/payments/ — record payment for an order"""
    serializer_class   = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        order = serializer.validated_data['order']
        # Ensure this order belongs to the current user
        customer = get_customer(self.request.user)
        if order.customer != customer:
            raise PermissionDenied("This order does not belong to you.")
        if hasattr(order, 'payment'):
            raise ValidationError("Payment already exists for this order.")
        serializer.save(amount=order.total_amount)


class PaymentDetailView(generics.RetrieveAPIView):
    """GET /api/payments/<id>/"""
    serializer_class   = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = get_customer(self.request.user)
        return Payment.objects.filter(order__customer=customer)


# ── Analytics (seller) ───────────────────────────────────────────

class AnalyticsSalesTrendView(APIView):
    """
    GET /api/analytics/sales-trend/
    Params: ?period=monthly|daily (default monthly)
            ?months=6 (how many months back, default 12)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        get_seller(request.user)   # must be a seller
        period = request.query_params.get('period', 'monthly')
        months = int(request.query_params.get('months', 12))

        from django.utils import timezone
        from datetime import timedelta
        since = timezone.now() - timedelta(days=months * 30)

        trunc = TruncMonth if period == 'monthly' else TruncDay

        data = (
            Order.objects
            .filter(created_at__gte=since)
            .exclude(status=OrderStatus.CANCELLED)
            .annotate(period=trunc('created_at'))
            .values('period')
            .annotate(
                revenue=Sum('total_amount'),
                orders=Count('id')
            )
            .order_by('period')
        )

        return Response([{
            'period':  d['period'].strftime('%Y-%m' if period == 'monthly' else '%Y-%m-%d'),
            'revenue': float(d['revenue']),
            'orders':  d['orders'],
        } for d in data])


class AnalyticsTopProductsView(APIView):
    """GET /api/analytics/top-products/?limit=10"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        get_seller(request.user)
        limit = int(request.query_params.get('limit', 10))

        data = (
            OrderItem.objects
            .values('product__id', 'product__product_name', 'product__category__category_name')
            .annotate(
                units_sold=Sum('quantity'),
                revenue=Sum(F('quantity') * F('price'))
            )
            .order_by('-units_sold')[:limit]
        )

        return Response([{
            'product_id':    d['product__id'],
            'product_name':  d['product__product_name'],
            'category':      d['product__category__category_name'],
            'units_sold':    d['units_sold'],
            'revenue':       float(d['revenue']),
        } for d in data])


class AnalyticsRevenueByCityView(APIView):
    """GET /api/analytics/revenue-by-city/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        get_seller(request.user)

        data = (
            Order.objects
            .exclude(status=OrderStatus.CANCELLED)
            .select_related('customer__user')
            .values(city=F('customer__user__city'))
            .annotate(
                revenue=Sum('total_amount'),
                orders=Count('id')
            )
            .order_by('-revenue')
        )

        return Response([{
            'city':    d['city'],
            'revenue': float(d['revenue']),
            'orders':  d['orders'],
        } for d in data])


class AnalyticsCategoryPerformanceView(APIView):
    """GET /api/analytics/category-performance/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        get_seller(request.user)

        data = (
            OrderItem.objects
            .values('product__category__id', 'product__category__category_name')
            .annotate(
                units_sold=Sum('quantity'),
                revenue=Sum(F('quantity') * F('price'))
            )
            .order_by('-revenue')
        )

        return Response([{
            'category_id':   d['product__category__id'],
            'category_name': d['product__category__category_name'],
            'units_sold':    d['units_sold'],
            'revenue':       float(d['revenue']),
        } for d in data])


class AnalyticsSellerDashboardView(APIView):
    """
    GET /api/analytics/seller-dashboard/
    Returns summary stats for THIS seller only
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        seller = get_seller(request.user)

        # All order items belonging to this seller's products
        seller_items = OrderItem.objects.filter(product__seller=seller)

        total_revenue = seller_items.aggregate(
            rev=Sum(F('quantity') * F('price'))
        )['rev'] or 0

        total_orders = (
            Order.objects
            .filter(items__product__seller=seller)
            .exclude(status=OrderStatus.CANCELLED)
            .distinct()
            .count()
        )

        total_products = Product.objects.filter(seller=seller).count()

        low_stock = Product.objects.filter(seller=seller, stock_quantity__lte=5).count()

        top_products = (
            seller_items
            .values('product__product_name')
            .annotate(units=Sum('quantity'), rev=Sum(F('quantity') * F('price')))
            .order_by('-units')[:5]
        )

        monthly = (
            Order.objects
            .filter(items__product__seller=seller)
            .exclude(status=OrderStatus.CANCELLED)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total_amount'), orders=Count('id', distinct=True))
            .order_by('month')
        )

        return Response({
            'summary': {
                'total_revenue':   float(total_revenue),
                'total_orders':    total_orders,
                'total_products':  total_products,
                'low_stock_count': low_stock,
            },
            'top_products': [{
                'name':    p['product__product_name'],
                'units':   p['units'],
                'revenue': float(p['rev']),
            } for p in top_products],
            'monthly_trend': [{
                'month':   m['month'].strftime('%Y-%m'),
                'revenue': float(m['revenue']),
                'orders':  m['orders'],
            } for m in monthly],
        })
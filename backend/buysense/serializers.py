from rest_framework import serializers
from .models import (
    User, Customer, Seller, Category, Product,
    CartItem, Order, OrderItem, Payment, Review
)


# ── Auth ─────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["id", "username", "email", "password",
                  "first_name", "last_name", "country", "city", "created_at"]
        extra_kwargs = {
            "password":   {"write_only": True},
            "created_at": {"read_only": True},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# ── Profiles ─────────────────────────────────────────────────────

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = ["id", "phone"]


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Seller
        fields = ["id", "seller_name", "address", "phone", "profile_image"]


# ── Catalogue ────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "category_name", "category_desc"]


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = ["id", "customer_name", "rating", "comment", "created_at"]
        extra_kwargs = {"created_at": {"read_only": True}}

    def get_customer_name(self, obj):
        return obj.customer.user.get_full_name() or obj.customer.user.username

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ProductSerializer(serializers.ModelSerializer):
    category    = CategorySerializer(read_only=True)
    seller      = SellerSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    avg_rating   = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            "id", "product_name", "product_desc", "product_price",
            "stock_quantity", "product_image",
            "category", "category_id",
            "seller",
            "avg_rating", "review_count",
            "created_at",
        ]
        extra_kwargs = {
            "created_at":    {"read_only": True},
            "product_image": {"required": False},
        }

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    def get_review_count(self, obj):
        return obj.reviews.count()


# ── Cart ─────────────────────────────────────────────────────────

class CartItemSerializer(serializers.ModelSerializer):
    product    = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model  = CartItem
        fields = ["id", "product", "product_id", "quantity", "subtotal", "added_at"]
        extra_kwargs = {"added_at": {"read_only": True}}

    def get_subtotal(self, obj):
        return round(float(obj.product.product_price) * obj.quantity, 2)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


# ── Orders ───────────────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    product    = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model  = OrderItem
        fields = ["id", "product", "product_id", "quantity", "price"]
        extra_kwargs = {"price": {"read_only": True}}

    def validate(self, data):
        data["price"] = data["product"].product_price
        return data


class OrderSerializer(serializers.ModelSerializer):
    items    = OrderItemSerializer(many=True)
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model  = Order
        fields = ["id", "customer", "address", "status",
                  "total_amount", "created_at", "items"]
        extra_kwargs = {
            "total_amount": {"read_only": True},
            "created_at":   {"read_only": True},
            "status":       {"read_only": True},
        }

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        total = sum(
            item["product"].product_price * item["quantity"]
            for item in items_data
        )
        validated_data["total_amount"] = total
        order = Order.objects.create(**validated_data)
        for item in items_data:
            # price is already set by OrderItemSerializer.validate()
            OrderItem.objects.create(order=order, **item)
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Seller-only: update order status."""
    class Meta:
        model  = Order
        fields = ["status"]


# ── Payments ─────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(), source='order', write_only=True
    )
    order = OrderSerializer(read_only=True)

    class Meta:
        model  = Payment
        fields = ["id", "order", "order_id", "amount", "is_paid", "method", "payment_date"]
        extra_kwargs = {
            "payment_date": {"read_only": True},
            "amount":       {"read_only": True},
        }
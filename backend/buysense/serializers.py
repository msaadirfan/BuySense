from rest_framework import serializers
from .models import User, Customer, Seller, Category, Product, Order, OrderItem, Payment


# ─── AUTH ────────────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "country", "city", "created_at"]
        extra_kwargs = {
            "password": {"write_only": True},
            "created_at": {"read_only": True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
# ─── CUSTOMER & SELLER ───────────────────────────────────────────────────────
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "phone"]   # user is set in perform_create, not by the client
class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ["id", "seller_name", "address", "phone", "profile_image"]
# ─── CATALOGUE ───────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "category_name", "category_desc"]


class ProductSerializer(serializers.ModelSerializer):
    # Read: show names. Write: accept FK ids.
    category = CategorySerializer(read_only=True)
    seller = SellerSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    seller_id = serializers.PrimaryKeyRelatedField(
        queryset=Seller.objects.all(), source="seller", write_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "product_name", "product_desc", "product_price",
            "stock_quantity", "product_image",
            "category", "category_id",
            "seller", "seller_id",
            "created_at",
        ]
        extra_kwargs = {"created_at": {"read_only": True}}


# ─── ORDERS ──────────────────────────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_id", "quantity", "price"]
        extra_kwargs = {"price": {"read_only": True}}  # set automatically from product price

    def validate(self, data):
        # Auto-fill price from product at time of purchase
        data["price"] = data["product"].product_price
        return data


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)          # nested order items
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source="customer", write_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id", "customer", "customer_id",
            "address", "status", "total_amount",
            "created_at", "items",
        ]
        extra_kwargs = {
            "total_amount": {"read_only": True},  # calculated on create
            "created_at":   {"read_only": True},
        }

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        # Calculate total from items
        total = sum(
            item["product"].product_price * item["quantity"]
            for item in items_data
        )
        validated_data["total_amount"] = total

        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                price=item_data["product"].product_price,  # snapshot price
                **item_data
            )

        return order


# ─── PAYMENT ─────────────────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(), source="order", write_only=True
    )

    class Meta:
        model = Payment
        fields = ["id", "order", "order_id", "amount", "is_paid", "method", "payment_date"]
        extra_kwargs = {"payment_date": {"read_only": True}}
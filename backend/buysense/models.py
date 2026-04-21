from django.db import models
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    country    = models.CharField(max_length=50, blank=True)
    city       = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Customer(models.Model):
    user  = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)

    def __str__(self):
        return self.user.username


class Seller(models.Model):
    user          = models.OneToOneField(User, on_delete=models.CASCADE)
    seller_name   = models.CharField(max_length=50)
    address       = models.CharField(max_length=200)
    phone         = models.CharField(max_length=20)
    profile_image = models.ImageField(upload_to='sellers/', blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.seller_name


class Category(models.Model):
    category_name = models.CharField(max_length=50)
    category_desc = models.CharField(max_length=200)

    def __str__(self):
        return self.category_name


class Product(models.Model):
    product_name  = models.CharField(max_length=100)
    product_desc  = models.CharField(max_length=500)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    product_image = models.ImageField(upload_to='products/', blank=True)
    category      = models.ForeignKey(Category, on_delete=models.CASCADE)
    seller        = models.ForeignKey(Seller, on_delete=models.CASCADE)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['seller']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.product_name


# ── Cart ─────────────────────────────────────────────────────────

class CartItem(models.Model):
    """
    One row per product per user in their cart.
    No separate Cart model — the user IS the cart.
    """
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product   = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity  = models.PositiveIntegerField(default=1)
    added_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')   # one row per product per user
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.product.product_name} x{self.quantity}"


# ── Orders ───────────────────────────────────────────────────────

class OrderStatus(models.TextChoices):
    PENDING   = 'PENDING',   'Pending'
    SHIPPED   = 'SHIPPED',   'Shipped'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Order(models.Model):
    customer     = models.ForeignKey(Customer, on_delete=models.CASCADE)
    address      = models.CharField(max_length=200)
    status       = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at   = models.DateTimeField(auto_now_add=True)
    products     = models.ManyToManyField("Product", through='OrderItem')

    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Order {self.id}"


class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price    = models.DecimalField(max_digits=10, decimal_places=2)  # snapshot

    class Meta:
        indexes = [
            models.Index(fields=['product']),
        ]


# ── Payments ─────────────────────────────────────────────────────

class PaymentMethod(models.TextChoices):
    COD           = 'COD',   'Cash on Delivery'
    BANK_TRANSFER = 'BANK',  'Bank Transfer'
    EASYPAISA     = 'EASYP', 'Easypaisa'


class Payment(models.Model):
    order        = models.OneToOneField(Order, on_delete=models.CASCADE)
    amount       = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid      = models.BooleanField(default=False)
    method       = models.CharField(
        max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.COD
    )
    payment_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['method']),
            models.Index(fields=['payment_date']),
        ]


# ── Reviews ──────────────────────────────────────────────────────

class Review(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer   = models.ForeignKey(Customer, on_delete=models.CASCADE)
    rating     = models.PositiveSmallIntegerField()   # 1–5
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'customer')     # one review per product per customer
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return f"{self.customer.user.username} → {self.product.product_name} ({self.rating}★)"
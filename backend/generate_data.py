"""
BuySense — Data Generation Script
Run from your project root:
    python manage.py shell < generate_data.py
OR place in your app folder and run:
    python manage.py runscript generate_data   (requires django-extensions)

Generates:
  - 10 categories
  - 30 sellers  (each also gets a customer profile)
  - 200 customers
  - 300 products  (spread across sellers + categories)
  - 1000 orders   (spread across 12 months, multiple cities)
  - 1000 payments (attached to orders)
"""

import random
import os
import django
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from faker import Faker

# ── Bootstrap Django if running as a standalone script ──────────
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')  # ← change 'backend' to your project folder name
django.setup()

# Import AFTER django.setup()
from django.contrib.auth.hashers import make_password
from buysense.models import (   # ← change 'buysense' to your app name if different
    User, Customer, Seller, Category, Product,
    Order, OrderItem, Payment,
    OrderStatus, PaymentMethod
)

fake = Faker()
Faker.seed(42)
random.seed(42)

# ── Pakistani cities (used for analytics by city) ───────────────
CITIES = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur',
]

# ── Product categories with realistic product names ─────────────
CATEGORY_DATA = {
    'Electronics':      ['Wireless Earbuds', 'Bluetooth Speaker', 'USB-C Hub', 'Mechanical Keyboard',
                         'Gaming Mouse', 'Webcam HD', 'Power Bank 20000mAh', 'LED Desk Lamp',
                         'Smart Watch', 'Portable Charger', 'Laptop Stand', 'Screen Protector'],
    'Clothing':         ['Cotton T-Shirt', 'Denim Jeans', 'Casual Hoodie', 'Formal Shirt',
                         'Summer Dress', 'Sports Shorts', 'Winter Jacket', 'Polo Shirt',
                         'Cargo Pants', 'Kurti', 'Shalwar Kameez', 'Waistcoat'],
    'Books':            ['Python Programming', 'Data Structures Guide', 'Django for Beginners',
                         'Clean Code', 'Atomic Habits', 'Deep Work', 'SQL Mastery',
                         'The Pragmatic Programmer', 'Design Patterns', 'Urdu Novel Collection'],
    'Home & Kitchen':   ['Non-stick Pan', 'Rice Cooker', 'Electric Kettle', 'Blender',
                         'Dinner Set', 'Storage Containers', 'Knife Set', 'Pressure Cooker',
                         'Air Fryer', 'Coffee Maker', 'Toaster', 'Vacuum Cleaner'],
    'Sports':           ['Yoga Mat', 'Resistance Bands', 'Dumbbells Set', 'Jump Rope',
                         'Cricket Bat', 'Football', 'Badminton Racket', 'Cycling Gloves',
                         'Running Shoes', 'Water Bottle', 'Gym Bag', 'Skipping Rope'],
    'Beauty':           ['Face Moisturizer', 'Sunscreen SPF50', 'Lipstick Set', 'Mascara',
                         'Hair Serum', 'Face Wash', 'Body Lotion', 'Perfume',
                         'Nail Polish Set', 'Eye Shadow Palette', 'Foundation', 'Serum'],
    'Groceries':        ['Basmati Rice 5kg', 'Cooking Oil 5L', 'Sugar 1kg', 'Flour 10kg',
                         'Green Tea', 'Mixed Spices', 'Dates 500g', 'Honey 500g',
                         'Almonds 250g', 'Black Pepper', 'Turmeric Powder', 'Red Chilli'],
    'Toys & Games':     ['Lego Set', 'Remote Control Car', 'Puzzle 1000pc', 'Board Game',
                         'Action Figure', 'Doll House', 'Card Game', 'Building Blocks',
                         'Chess Set', 'Rubik\'s Cube', 'Toy Kitchen Set', 'Craft Kit'],
    'Automotive':       ['Car Phone Mount', 'Seat Covers', 'Dashboard Camera', 'Car Freshener',
                         'Tyre Inflator', 'Jump Starter', 'Car Vacuum', 'Steering Wheel Cover'],
    'Health':           ['Multivitamins', 'Protein Powder', 'Blood Pressure Monitor',
                         'Digital Thermometer', 'Pulse Oximeter', 'Vitamin C', 'Fish Oil',
                         'Hand Sanitizer', 'Face Mask Pack', 'First Aid Kit'],
}

# ── Price ranges per category ────────────────────────────────────
PRICE_RANGES = {
    'Electronics':    (800,  25000),
    'Clothing':       (500,   5000),
    'Books':          (300,   2500),
    'Home & Kitchen': (500,  15000),
    'Sports':         (300,  10000),
    'Beauty':         (200,   4000),
    'Groceries':      (100,   2000),
    'Toys & Games':   (400,   8000),
    'Automotive':     (500,  12000),
    'Health':         (200,   5000),
}

# ────────────────────────────────────────────────────────────────
# HELPERS
# ────────────────────────────────────────────────────────────────

def random_past_datetime(days_back=365):
    """Random datetime within the past N days — for time-series analytics."""
    delta = random.randint(0, days_back)
    hours = random.randint(0, 23)
    minutes = random.randint(0, 59)
    return timezone.now() - timedelta(days=delta, hours=hours, minutes=minutes)


def print_progress(label, current, total):
    bar_len = 30
    filled = int(bar_len * current / total)
    bar = '█' * filled + '░' * (bar_len - filled)
    print(f'\r  {label}: [{bar}] {current}/{total}', end='', flush=True)
    if current == total:
        print()


# ────────────────────────────────────────────────────────────────
# STEP 1 — CATEGORIES
# ────────────────────────────────────────────────────────────────

def create_categories():
    print('\n[1/6] Creating categories...')
    categories = {}
    for name, _ in CATEGORY_DATA.items():
        cat, _ = Category.objects.get_or_create(
            category_name=name,
            defaults={'category_desc': f'Browse our {name.lower()} collection'}
        )
        categories[name] = cat
    print(f'  ✓ {len(categories)} categories ready')
    return categories


# ────────────────────────────────────────────────────────────────
# STEP 2 — SELLERS
# ────────────────────────────────────────────────────────────────

def create_sellers(count=30):
    print(f'\n[2/6] Creating {count} sellers...')
    sellers = []

    for i in range(count):
        city = random.choice(CITIES)
        username = f'seller_{fake.unique.user_name()}'[:50]

        # Base user
        user = User.objects.create(
            username=username,
            email=f'{username}@example.com',
            password=make_password('password123'),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            country='Pakistan',
            city=city,
        )

        # Seller profile
        seller = Seller.objects.create(
            user=user,
            seller_name=fake.company()[:50],
            address=f'{fake.street_address()}, {city}',
            phone=f'03{random.randint(10,49)}{random.randint(1000000,9999999)}',
            profile_image='',
        )

        # Sellers are also customers
        Customer.objects.create(
            user=user,
            phone=seller.phone,
        )

        sellers.append(seller)
        print_progress('Sellers', i + 1, count)

    return sellers


# ────────────────────────────────────────────────────────────────
# STEP 3 — CUSTOMERS
# ────────────────────────────────────────────────────────────────

def create_customers(count=200):
    print(f'\n[3/6] Creating {count} customers...')
    customers = []

    for i in range(count):
        city = random.choice(CITIES)
        username = f'user_{fake.unique.user_name()}'[:50]

        user = User.objects.create(
            username=username,
            email=f'{username}@example.com',
            password=make_password('password123'),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            country='Pakistan',
            city=city,
        )

        customer = Customer.objects.create(
            user=user,
            phone=f'03{random.randint(10,49)}{random.randint(1000000,9999999)}',
        )

        customers.append(customer)
        print_progress('Customers', i + 1, count)

    return customers


# ────────────────────────────────────────────────────────────────
# STEP 4 — PRODUCTS
# ────────────────────────────────────────────────────────────────

def create_products(sellers, categories, count=300):
    print(f'\n[4/6] Creating {count} products...')
    products = []

    cat_names   = list(CATEGORY_DATA.keys())
    created_at_range = 400  # products can be older than orders

    for i in range(count):
        cat_name  = random.choice(cat_names)
        category  = categories[cat_name]
        seller    = random.choice(sellers)
        base_name = random.choice(CATEGORY_DATA[cat_name])
        low, high = PRICE_RANGES[cat_name]

        # Add slight variation to product names to avoid duplicates
        product_name = f'{base_name}' if random.random() > 0.3 else f'{base_name} {fake.color_name()}'

        product = Product(
            product_name=product_name[:100],
            product_desc=fake.sentence(nb_words=12),
            product_price=Decimal(str(round(random.uniform(low, high), 2))),
            stock_quantity=random.randint(0, 200),
            product_image='',
            category=category,
            seller=seller,
        )
        # Manually set created_at (auto_now_add prevents direct assignment)
        Product.objects.bulk_create([product])
        products.append(product)
        print_progress('Products', i + 1, count)

    # Re-fetch with IDs
    products = list(Product.objects.all())
    return products


# ────────────────────────────────────────────────────────────────
# STEP 5 — ORDERS + ORDER ITEMS
# ────────────────────────────────────────────────────────────────

def create_orders(customers, products, count=1000):
    print(f'\n[5/6] Creating {count} orders + items...')

    statuses = [
        OrderStatus.PENDING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.DELIVERED,   # weight delivered more — realistic
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
    ]

    orders_to_create   = []
    items_to_create    = []

    for i in range(count):
        customer   = random.choice(customers)
        city       = customer.user.city
        num_items  = random.randint(1, 5)
        chosen     = random.sample(products, min(num_items, len(products)))

        # Calculate total
        total = Decimal('0.00')
        line_items = []
        for product in chosen:
            qty   = random.randint(1, 4)
            price = product.product_price
            total += price * qty
            line_items.append((product, qty, price))

        order = Order(
            customer=customer,
            address=f'{fake.street_address()}, {city}',
            status=random.choice(statuses),
            total_amount=total,
        )
        orders_to_create.append((order, line_items))
        print_progress('Orders', i + 1, count)

    print('\n  Saving orders to DB...')

    created_orders = []
    for order, line_items in orders_to_create:
        order.save()
        # Backdate created_at for time-series analytics
        Order.objects.filter(pk=order.pk).update(
            created_at=random_past_datetime(days_back=365)
        )
        for product, qty, price in line_items:
            items_to_create.append(OrderItem(
                order=order,
                product=product,
                quantity=qty,
                price=price,
            ))
        created_orders.append(order)

    print('  Saving order items...')
    OrderItem.objects.bulk_create(items_to_create, batch_size=500)

    return created_orders


# ────────────────────────────────────────────────────────────────
# STEP 6 — PAYMENTS
# ────────────────────────────────────────────────────────────────

def create_payments(orders):
    print(f'\n[6/6] Creating payments...')

    methods = [
        PaymentMethod.COD,
        PaymentMethod.COD,          # COD is most common in Pakistan
        PaymentMethod.COD,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.EASYPAISA,
    ]

    payments = []
    for i, order in enumerate(orders):
        is_delivered = order.status == OrderStatus.DELIVERED
        is_cancelled = order.status == OrderStatus.CANCELLED

        payment = Payment(
            order=order,
            amount=order.total_amount,
            is_paid=is_delivered,           # only delivered orders are paid
            method=random.choice(methods),
        )
        payments.append(payment)
        print_progress('Payments', i + 1, len(orders))

    Payment.objects.bulk_create(payments, batch_size=500)
    print(f'  ✓ {len(payments)} payments created')


# ────────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────────

def run():
    print('=' * 50)
    print('  BuySense — Data Generation Script')
    print('=' * 50)

    # Safety check
    existing = User.objects.count()
    if existing > 5:
        confirm = input(f'\n  ⚠  Database already has {existing} users. Continue and ADD more? (y/n): ')
        if confirm.lower() != 'y':
            print('  Aborted.')
            return

    categories = create_categories()
    sellers    = create_sellers(count=30)
    customers  = create_customers(count=200)

    # Include seller-customers in the customer pool for orders
    seller_customers = list(Customer.objects.filter(user__in=[s.user for s in sellers]))
    all_customers    = customers + seller_customers

    products = create_products(sellers, categories, count=300)
    orders   = create_orders(all_customers, products, count=1000)
    create_payments(orders)

    print('\n' + '=' * 50)
    print('  ✅ Generation complete!')
    print('=' * 50)
    print(f'  Categories : {Category.objects.count()}')
    print(f'  Sellers    : {Seller.objects.count()}')
    print(f'  Customers  : {Customer.objects.count()}')
    print(f'  Products   : {Product.objects.count()}')
    print(f'  Orders     : {Order.objects.count()}')
    print(f'  OrderItems : {OrderItem.objects.count()}')
    print(f'  Payments   : {Payment.objects.count()}')
    print('=' * 50)
    print('\n  All passwords are: password123')
    print('  Cities used:', ', '.join(CITIES[:5]), '...')
    print()

if __name__ == "__main__":
    run()
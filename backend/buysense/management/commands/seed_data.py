"""
seed_data — Populate the BuySense database with realistic demo data.

Usage:  python manage.py seed_data
        python manage.py seed_data --flush   (wipe first, then seed)
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from buysense.models import (
    User, Customer, Seller, Category, Product,
    Order, OrderItem, Payment, Review,
    OrderStatus, PaymentMethod,
)


# ── Realistic Pakistani data ─────────────────────────────────────

CITIES = [
    'Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur',
]

FIRST_NAMES = [
    'Ahmed', 'Ali', 'Hassan', 'Usman', 'Bilal',
    'Fatima', 'Ayesha', 'Zainab', 'Hira', 'Sana',
    'Hamza', 'Omar', 'Saad', 'Rehan', 'Kamran',
    'Maria', 'Noor', 'Amna', 'Mehwish', 'Rabia',
]

LAST_NAMES = [
    'Khan', 'Ahmed', 'Ali', 'Malik', 'Sheikh',
    'Butt', 'Iqbal', 'Hussain', 'Shah', 'Raza',
    'Siddiqui', 'Qureshi', 'Mirza', 'Aslam', 'Javed',
]

SELLER_NAMES = [
    'TechHub Pakistan',
    'Fashion Street PK',
    'BookWorm Reads',
    'HomeStyle Living',
    'SportZone Pakistan',
]

SELLER_ADDRESSES = [
    'Blue Area, Islamabad',
    'Liberty Market, Lahore',
    'Saddar, Karachi',
    'Commercial Market, Rawalpindi',
    'Jinnah Road, Faisalabad',
]

CATEGORIES_DATA = [
    ('Electronics',     'Laptops, phones, gadgets, and accessories'),
    ('Clothing',        'Men\'s and women\'s apparel, shoes, and accessories'),
    ('Books',           'Fiction, non-fiction, textbooks, and stationery'),
    ('Home & Kitchen',  'Furniture, appliances, cookware, and decor'),
    ('Sports',          'Equipment, activewear, and outdoor gear'),
    ('Beauty',          'Skincare, makeup, fragrances, and personal care'),
    ('Groceries',       'Food, beverages, snacks, and household essentials'),
    ('Toys & Games',    'Board games, action figures, puzzles, and RC toys'),
    ('Automotive',      'Car accessories, tools, cleaning, and parts'),
    ('Health',          'Vitamins, supplements, medical devices, and wellness'),
]

# Products per category (name, price_range_min, price_range_max, desc_template)
PRODUCTS = {
    'Electronics': [
        ('Wireless Bluetooth Earbuds Pro', 2500, 8500, 'Premium sound quality with active noise cancellation and 24h battery life'),
        ('USB-C Fast Charging Cable 2m', 350, 1200, 'Durable braided nylon cable supporting 65W fast charging'),
        ('Portable Power Bank 20000mAh', 3000, 7500, 'Slim design with dual USB ports and LED battery indicator'),
        ('Mechanical Gaming Keyboard RGB', 4500, 12000, 'Cherry MX switches with customizable per-key RGB lighting'),
        ('Wireless Mouse Ergonomic', 1500, 4500, 'Ergonomic vertical design reduces wrist strain, 6 buttons'),
        ('Smart Watch Fitness Tracker', 3500, 15000, 'Heart rate monitor, SpO2, sleep tracking, 7-day battery'),
        ('Webcam 1080p HD with Mic', 2000, 6000, 'Auto-focus webcam with built-in noise-cancelling microphone'),
        ('USB Hub 7-Port USB 3.0', 1800, 4500, 'Powered USB hub with individual switches and LED indicators'),
        ('Laptop Stand Adjustable Aluminum', 2500, 5500, 'Adjustable height and angle, foldable for portability'),
        ('Wireless Charging Pad 15W', 1200, 3500, 'Qi-compatible fast wireless charger with anti-slip surface'),
    ],
    'Clothing': [
        ('Premium Cotton T-Shirt', 800, 2500, 'Soft 100% combed cotton, available in multiple colors'),
        ('Slim Fit Denim Jeans', 2500, 6000, 'Stretch denim with modern slim fit and reinforced stitching'),
        ('Casual Hoodie Pullover', 2000, 5500, 'Fleece-lined hoodie with kangaroo pocket and adjustable drawstring'),
        ('Formal Dress Shirt', 1800, 4500, 'Wrinkle-resistant cotton blend, perfect for office wear'),
        ('Running Shoes Breathable', 3500, 9000, 'Lightweight mesh upper with cushioned EVA sole'),
        ('Winter Jacket Waterproof', 4000, 12000, 'Insulated waterproof jacket with detachable hood'),
        ('Leather Belt Genuine', 800, 3000, 'Full-grain leather with classic buckle design'),
        ('Sports Shorts Quick-Dry', 900, 2500, 'Moisture-wicking fabric with zip pockets'),
        ('Polo Shirt Classic Fit', 1200, 3500, 'Pique cotton polo with embroidered logo'),
        ('Woolen Sweater V-Neck', 2500, 6500, 'Pure merino wool blend, perfect for winter layering'),
    ],
    'Books': [
        ('Data Structures & Algorithms', 1500, 4500, 'Comprehensive guide covering all major data structures and algorithms'),
        ('Python Programming Masterclass', 2000, 5000, 'From beginner to advanced Python with real-world projects'),
        ('Islamic History Collection', 800, 2500, 'Beautifully illustrated history of Islamic civilization'),
        ('IELTS Preparation Guide', 1200, 3500, 'Complete preparation kit with practice tests and tips'),
        ('Children\'s Urdu Story Book', 400, 1200, 'Colorful illustrations with classic Urdu stories'),
        ('Business Management Essentials', 1800, 4000, 'MBA-level concepts explained in simple language'),
        ('Cooking Recipes Pakistani', 600, 2000, 'Traditional and modern Pakistani recipes with step-by-step guides'),
        ('English Grammar Workbook', 500, 1500, 'Practice exercises for all levels of English learners'),
        ('Machine Learning Fundamentals', 2500, 6000, 'Hands-on ML with Python, TensorFlow, and real datasets'),
        ('Self-Help Motivational Book', 700, 2200, 'Inspiring stories and practical advice for personal growth'),
    ],
    'Home & Kitchen': [
        ('Non-Stick Cookware Set 5pc', 3500, 9000, 'Premium ceramic-coated pans with heat-resistant handles'),
        ('LED Desk Lamp Adjustable', 1500, 4500, 'Touch-control LED lamp with 5 brightness levels and USB port'),
        ('Memory Foam Pillow', 1200, 3500, 'Contoured memory foam for optimal neck support'),
        ('Stainless Steel Water Bottle', 600, 1800, 'Double-wall vacuum insulated, keeps drinks cold 24h'),
        ('Electric Kettle 1.8L', 2000, 5000, 'Fast-boil kettle with auto shut-off and boil-dry protection'),
        ('Wall Clock Modern Design', 800, 2500, 'Silent sweep movement with minimalist aesthetic'),
        ('Bed Sheet Set King Size', 2500, 6000, '400 thread count Egyptian cotton with deep pockets'),
        ('Kitchen Knife Set 6pc', 3000, 8000, 'High-carbon stainless steel with ergonomic handles'),
        ('Indoor Plant Pot Ceramic', 500, 2000, 'Handcrafted ceramic pot with drainage hole'),
        ('Vacuum Cleaner Handheld', 4500, 12000, 'Cordless handheld vacuum with HEPA filter and 30min runtime'),
    ],
    'Sports': [
        ('Cricket Bat English Willow', 5000, 25000, 'Grade 1 English willow with premium handle grip'),
        ('Football Official Size 5', 1500, 4500, 'FIFA-quality match ball with hand-stitched panels'),
        ('Yoga Mat Non-Slip 6mm', 1200, 3500, 'Eco-friendly TPE material with alignment lines'),
        ('Resistance Bands Set 5pc', 800, 2500, 'Latex-free bands with 5 resistance levels'),
        ('Badminton Racket Carbon', 2000, 8000, 'Carbon fiber frame with high-tension strings'),
        ('Gym Gloves Weight Lifting', 600, 2000, 'Padded palm with wrist support and ventilation'),
        ('Table Tennis Set Complete', 1500, 5000, 'Includes 2 rackets, 3 balls, and retractable net'),
        ('Sports Water Bottle 1L', 400, 1200, 'BPA-free with flip-top lid and carrying strap'),
        ('Hiking Backpack 40L', 3000, 8000, 'Waterproof with multiple compartments and rain cover'),
        ('Jump Rope Speed Adjustable', 300, 1000, 'Ball-bearing handles for smooth, fast rotation'),
    ],
    'Beauty': [
        ('Face Moisturizer SPF30', 800, 3500, 'Lightweight daily moisturizer with sun protection'),
        ('Hair Straightener Ceramic', 2500, 7000, 'Floating ceramic plates with adjustable temperature'),
        ('Perfume Gift Set', 3000, 10000, 'Luxury fragrance collection with 4 signature scents'),
        ('Makeup Brush Set 12pc', 1200, 4000, 'Synthetic bristles with rose gold handles'),
        ('Face Wash Gentle Cleanser', 400, 1500, 'Dermatologist-tested for sensitive skin'),
        ('Lip Gloss Collection 6pc', 600, 2000, 'High-shine formula with vitamin E'),
        ('Hair Oil Argan Organic', 800, 2500, 'Cold-pressed argan oil for hair repair and shine'),
        ('Body Lotion Shea Butter', 500, 1800, 'Deep moisturizing with natural shea butter'),
        ('Nail Polish Set 8pc', 400, 1500, 'Long-lasting, chip-resistant formula in trendy colors'),
        ('Eye Shadow Palette 18 Colors', 1500, 5000, 'Matte and shimmer shades with built-in mirror'),
    ],
    'Groceries': [
        ('Basmati Rice Premium 5kg', 1200, 2500, 'Extra-long grain aged basmati from Punjab'),
        ('Green Tea Collection Box', 400, 1200, 'Assorted green tea flavors, 50 tea bags'),
        ('Olive Oil Extra Virgin 1L', 1500, 3500, 'Cold-pressed imported olive oil'),
        ('Honey Pure Organic 500g', 800, 2000, 'Raw, unprocessed honey from Northern Pakistan'),
        ('Mixed Dry Fruits 1kg', 2000, 5000, 'Premium quality almonds, cashews, walnuts, and pistachios'),
        ('Spice Box Set 12 Spices', 600, 1800, 'Authentic Pakistani spices in a wooden box'),
        ('Coffee Beans Arabica 500g', 1200, 3000, 'Single-origin roasted Arabica beans'),
        ('Protein Powder Whey 1kg', 3500, 8000, '24g protein per serving with BCAAs'),
        ('Cooking Oil Canola 5L', 1800, 3000, 'Heart-healthy canola oil for everyday cooking'),
        ('Dark Chocolate Bar 70%', 300, 900, 'Premium Belgian dark chocolate with cocoa nibs'),
    ],
    'Toys & Games': [
        ('Building Blocks Set 500pc', 2000, 6000, 'Compatible with major brands, multiple colors and sizes'),
        ('Remote Control Car 4WD', 3000, 9000, 'All-terrain RC car with 2.4GHz remote and rechargeable battery'),
        ('Board Game Strategy Collection', 1500, 4500, 'Family game night essentials with multiple classic games'),
        ('Art Supply Kit Complete', 1200, 3500, 'Includes colored pencils, markers, watercolors, and sketchpad'),
        ('Puzzle 1000 Pieces Landscape', 800, 2500, 'High-quality cardboard puzzle with stunning scenery'),
        ('Action Figure Collectible', 1500, 5000, 'Detailed articulated figure with accessories'),
        ('Educational Tablet Kids', 3000, 8000, 'Pre-loaded with learning apps, parental controls included'),
        ('Drone Mini Camera 720p', 4000, 12000, 'Foldable mini drone with camera and one-key return'),
        ('Stuffed Animal Plush Large', 800, 3000, 'Super soft plush toy, perfect gift for kids'),
        ('Card Game Family Pack', 400, 1200, 'Fun card game for 2-8 players, ages 7+'),
    ],
    'Automotive': [
        ('Car Phone Mount Magnetic', 500, 1500, 'Strong magnetic mount for dashboard and air vent'),
        ('Dash Camera 1080p WiFi', 4000, 10000, 'Wide-angle dashcam with night vision and parking mode'),
        ('Car Vacuum Cleaner Portable', 2000, 5000, 'Powerful suction with HEPA filter and accessories'),
        ('Tire Pressure Gauge Digital', 600, 1800, 'Accurate digital gauge with backlit LCD display'),
        ('Car Seat Cover Set Universal', 3000, 8000, 'Premium faux leather with airbag-compatible design'),
        ('LED Car Interior Lights Strip', 800, 2500, 'RGB LED strips with remote control and music sync'),
        ('Car Air Freshener Set', 300, 1000, 'Long-lasting fragrances in decorative designs'),
        ('Emergency Car Kit', 2500, 6000, 'Includes jumper cables, flashlight, first aid, and tools'),
        ('Steering Wheel Cover Leather', 600, 2000, 'Anti-slip genuine leather cover with elegant stitching'),
        ('Car Wash Kit Complete', 1200, 3500, 'Microfiber towels, shampoo, wax, and applicators'),
    ],
    'Health': [
        ('Digital Blood Pressure Monitor', 3000, 7000, 'Automatic BP monitor with irregular heartbeat detection'),
        ('Vitamin D3 Supplements 60ct', 500, 1500, 'High-potency Vitamin D3 for bone and immune health'),
        ('Pulse Oximeter Fingertip', 1500, 4000, 'OLED display showing SpO2 and pulse rate'),
        ('Electric Toothbrush Sonic', 2500, 6000, '5 brushing modes with 2-minute timer and pressure sensor'),
        ('First Aid Kit 100pc', 800, 2500, 'Comprehensive first aid kit for home, car, and travel'),
        ('Multivitamin Daily 90ct', 600, 2000, 'Complete multivitamin with minerals and antioxidants'),
        ('Heating Pad Electric', 1500, 4000, 'Moist/dry heat therapy with auto shut-off'),
        ('Hand Sanitizer Pack 6x250ml', 600, 1500, '70% alcohol-based sanitizer with moisturizers'),
        ('Omega-3 Fish Oil 120ct', 1200, 3500, 'Triple-strength EPA/DHA for heart and brain health'),
        ('Thermometer Infrared No-Contact', 2000, 5000, 'Instant-read forehead thermometer with fever alarm'),
    ],
}

REVIEW_COMMENTS = [
    'Excellent product! Exactly what I needed.',
    'Great quality for the price. Would recommend.',
    'Very satisfied with my purchase. Fast delivery too.',
    'Good product but packaging could be better.',
    'Decent quality. Met my expectations.',
    'Amazing! Will definitely buy again.',
    'Product was as described. Happy customer.',
    'Could be better but works fine for daily use.',
    'Love it! Perfect gift for my family.',
    'Premium quality. Worth every rupee.',
    'Not bad, but I expected slightly better quality.',
    'Fantastic product! Exceeded my expectations.',
    'Solid build quality. Very durable.',
    'Quick delivery and great customer service.',
    'Really impressed with the quality at this price point.',
    '',  # Some reviews with no comment
    '',
]


class Command(BaseCommand):
    help = 'Seed the database with realistic Pakistani e-commerce demo data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush', action='store_true',
            help='Delete existing seed data before creating new data',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('Flushing existing data...')
            Review.objects.all().delete()
            Payment.objects.all().delete()
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            # Don't delete all users — keep superuser
            Customer.objects.all().delete()
            Seller.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('  ✓ Flushed'))

        self.stdout.write('\n🌱 Seeding BuySense database...\n')

        # ── Categories ──────────────────────────────────────────
        categories = {}
        for name, desc in CATEGORIES_DATA:
            cat, _ = Category.objects.get_or_create(
                category_name=name, defaults={'category_desc': desc}
            )
            categories[name] = cat
        self.stdout.write(f'  ✓ {len(categories)} categories')

        # ── Sellers ─────────────────────────────────────────────
        sellers = []
        for i, (sname, addr) in enumerate(zip(SELLER_NAMES, SELLER_ADDRESSES)):
            username = f'seller{i+1}'
            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
            else:
                user = User.objects.create_user(
                    username=username,
                    email=f'{username}@buysense.pk',
                    password='seller123',
                    first_name=random.choice(FIRST_NAMES),
                    last_name=random.choice(LAST_NAMES),
                    country='Pakistan',
                    city=CITIES[i],
                )
            # Create customer profile too (so they can shop)
            Customer.objects.get_or_create(user=user, defaults={'phone': f'+92 3{random.randint(10,99)} {random.randint(1000000,9999999)}'})
            seller, _ = Seller.objects.get_or_create(
                user=user,
                defaults={
                    'seller_name': sname,
                    'address': addr,
                    'phone': f'+92 3{random.randint(10,99)} {random.randint(1000000,9999999)}',
                }
            )
            sellers.append(seller)
        self.stdout.write(f'  ✓ {len(sellers)} sellers')

        # ── Customers ───────────────────────────────────────────
        customers = []
        for i in range(25):
            username = f'customer{i+1}'
            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
            else:
                fn = FIRST_NAMES[i % len(FIRST_NAMES)]
                ln = LAST_NAMES[i % len(LAST_NAMES)]
                user = User.objects.create_user(
                    username=username,
                    email=f'{username}@buysense.pk',
                    password='customer123',
                    first_name=fn,
                    last_name=ln,
                    country='Pakistan',
                    city=random.choice(CITIES),
                )
            cust, _ = Customer.objects.get_or_create(
                user=user,
                defaults={'phone': f'+92 3{random.randint(10,99)} {random.randint(1000000,9999999)}'}
            )
            customers.append(cust)
        self.stdout.write(f'  ✓ {len(customers)} customers')

        # ── Products ────────────────────────────────────────────
        all_products = []
        for cat_name, prods in PRODUCTS.items():
            cat = categories[cat_name]
            for pname, pmin, pmax, pdesc in prods:
                price = Decimal(str(random.randint(pmin, pmax)))
                # Round to nearest 50
                price = Decimal(str(int(price / 50) * 50))
                seller = random.choice(sellers)
                product, created = Product.objects.get_or_create(
                    product_name=pname,
                    seller=seller,
                    defaults={
                        'product_desc': pdesc,
                        'product_price': price,
                        'stock_quantity': random.randint(5, 200),
                        'category': cat,
                    }
                )
                all_products.append(product)
        self.stdout.write(f'  ✓ {len(all_products)} products')

        # ── Orders ──────────────────────────────────────────────
        # Spread orders over the past 12 months for good analytics
        now = timezone.now()
        statuses = [OrderStatus.PENDING, OrderStatus.SHIPPED,
                    OrderStatus.DELIVERED, OrderStatus.CANCELLED]
        status_weights = [15, 20, 55, 10]  # Realistic distribution
        methods = [PaymentMethod.COD, PaymentMethod.BANK_TRANSFER,
                   PaymentMethod.EASYPAISA]
        method_weights = [50, 25, 25]

        order_count = 0
        review_count = 0
        payment_count = 0

        for _ in range(600):
            customer = random.choice(customers)
            # Random date in the past 12 months
            days_ago = random.randint(0, 365)
            order_date = now - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )

            # Select 1-5 random products
            num_items = random.choices([1, 2, 3, 4, 5],
                                       weights=[30, 30, 20, 12, 8])[0]
            order_products = random.sample(
                all_products, min(num_items, len(all_products))
            )

            # Calculate total
            items_data = []
            total = Decimal('0')
            for prod in order_products:
                qty = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
                subtotal = prod.product_price * qty
                total += subtotal
                items_data.append((prod, qty, prod.product_price))

            status = random.choices(statuses, weights=status_weights)[0]

            order = Order.objects.create(
                customer=customer,
                address=f'{random.randint(1,999)} {random.choice(["Main Blvd", "Street", "Road", "Avenue", "Lane"])}, {customer.user.city}',
                status=status,
                total_amount=total,
            )
            # Override created_at
            Order.objects.filter(pk=order.pk).update(created_at=order_date)

            for prod, qty, price in items_data:
                OrderItem.objects.create(
                    order=order, product=prod, quantity=qty, price=price,
                )

            order_count += 1

            # Payment
            method = random.choices(methods, weights=method_weights)[0]
            is_paid = status in (OrderStatus.DELIVERED, OrderStatus.SHIPPED)
            Payment.objects.create(
                order=order,
                amount=total,
                is_paid=is_paid,
                method=method,
            )
            payment_count += 1

            # Reviews (only for delivered orders, with some probability)
            if status == OrderStatus.DELIVERED and random.random() < 0.6:
                for prod, _, _ in items_data:
                    if random.random() < 0.5:
                        # Check no duplicate review
                        if not Review.objects.filter(product=prod, customer=customer).exists():
                            rating = random.choices(
                                [1, 2, 3, 4, 5],
                                weights=[3, 5, 12, 35, 45]
                            )[0]
                            rev = Review.objects.create(
                                product=prod,
                                customer=customer,
                                rating=rating,
                                comment=random.choice(REVIEW_COMMENTS),
                            )
                            # Match the review date to shortly after the order date
                            Review.objects.filter(pk=rev.pk).update(created_at=order_date + timedelta(days=random.randint(1, 5)))
                            review_count += 1

        self.stdout.write(f'  ✓ {order_count} orders')
        self.stdout.write(f'  ✓ {payment_count} payments')
        self.stdout.write(f'  ✓ {review_count} reviews')

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Seeding complete! Database populated with demo data.\n'
            f'   Login as any seller:  seller1 / seller123\n'
            f'   Login as any customer: customer1 / customer123\n'
        ))

# BuySense - Data-Driven E-Commerce Platform

BuySense is a full-stack e-commerce application integrated with advanced database management features and a comprehensive seller analytics dashboard. This project fulfills the requirements for both **Web Development** and **Advanced Database Management Systems (ADMS)**.

## 👥 Group Members
- **Muhammad Saad Irfan** (Reg No: 508477)

---

## 📁 Submission Files
To submit this project, zip the following folders and files:
1.  `backend/` - Django source code (Excluding `venv` and `__pycache__`)
2.  `frontend/` - React source code (Excluding `node_modules`)
3.  `database_scripts/` - SQL scripts for stored procedures, triggers, and indexes.
4.  `requirements.txt` - Python dependencies.
5.  `README.md` - Setup and execution guide.

---

## 🚀 Setup Instructions

### 1. Database Setup
1.  Ensure you have **PostgreSQL** installed and running.
2.  Create a database named `buysense`.
3.  Execute the scripts in `database_scripts/adms_scripts.sql` to initialize stored procedures, triggers, and custom indexes.
    ```bash
    psql -U postgres -d buysense -f database_scripts/adms_scripts.sql
    ```

### 2. Backend Setup
1.  Navigate to the `backend` folder.
2.  Create and activate a virtual environment.
3.  Install dependencies:
    ```bash
    pip install -r ../requirements.txt
    ```
4.  Configure database settings in `backend/backend/settings.py` (DATABASES section).
5.  Run migrations:
    ```bash
    python manage.py migrate
    ```
6.  (Optional) Seed demo data to populate analytics:
    ```bash
    python manage.py seed_data
    ```
7.  Start the server:
    ```bash
    python manage.py runserver
    ```

### 3. Frontend Setup
1.  Navigate to the `frontend` folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

---

## 📊 ADMS Requirements Implementation

### 1. Stored Procedures
- `GetSellerPerformance(p_seller_id, p_start_date, p_end_date)`: Calculates total revenue and order count for a seller within a date range.

### 2. Triggers
- `trg_update_stock_after_order`: Automatically decrements product stock when an order is placed and prevents orders if stock is insufficient.

### 3. Indexes
- **Django Built-in**: Primary keys and foreign keys.
- **Custom Meta Indexes**: Optimizing `created_at` and `status` for order filtering.
- **Advanced Indexes**: Trigram index on `product_name` for fast search and composite indexes on order status.

---

## 🛠 Tech Stack
- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Recharts (Analytics).
- **Backend**: Django REST Framework.
- **Database**: PostgreSQL.
- **Authentication**: JWT / Django Session.

---

## 🔗 Access Links
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Admin Panel**: [http://localhost:8000/admin](http://localhost:8000/admin)
=======
# BuySense
A data-driven e-commerce platform with built-in seller analytics.

## Prerequisites
- Python 3.x
- Node.js
- PostgreSQL

## Setup

### 1. Clone the repository
```bash
git clone <repo-url>
cd buysense
```

### 2. Database
Create a PostgreSQL database named `buysense` and update the credentials in `backend/buysense/settings.py`.

### 3. Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Seed demo data (optional)
```bash
cd backend
python manage.py seed_data
```

This creates a seller account (`seller1`) with 12+ months of sales data to explore the analytics dashboard.

## Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

- # Database Design

### Schema
The database consists of 10 tables built around these core relationships:
- **User → Customer / Seller** — OneToOne profiles extending Django's base user
- **Product → Seller, Category** — ForeignKey links with cascade deletes
- **Order ↔ Product via OrderItem** — ManyToMany through a junction table that stores `quantity` and a price snapshot (so order history stays accurate even if a seller changes a product's price later)
- **Order → Payment** — OneToOne, one payment record per order

### Constraints
Two `unique_together` constraints enforced at the database level:
- `CartItem(user, product)` — a user can only have one cart row per product
- `Review(product, customer)` — a customer can only leave one review per product

Order status is restricted to `PENDING / SHIPPED / DELIVERED / CANCELLED` and payment method to `COD / BANK / EASYPAISA` using Django `TextChoices`, enforced as constrained string fields in PostgreSQL.

### Indexes
13 explicit indexes defined across 6 tables, targeting columns used in filters, joins, and ordering:

| Table | Indexed Columns |
|---|---|
| Product | category, seller, created_at |
| CartItem | user |
| Order | created_at, customer, status |
| OrderItem | product |
| Payment | method, payment_date |
| Review | product, rating |

### Query Optimization
- **`select_related`** — used on product listings, cart, reviews, and order queries to fetch related rows in a single SQL JOIN instead of firing a separate query per row
- **`prefetch_related`** — used for reverse FK and ManyToMany relations (e.g. orders + items + products) to avoid the N+1 query problem
- **`annotate` + `values`** — all analytics (revenue trends, top products, category performance, revenue by city) are computed entirely in PostgreSQL using grouped aggregations rather than pulling data into Python
- **`F()` expressions** — used for cross-field arithmetic inside queries, e.g. `Sum(F('quantity') * F('price'))` computes line item revenue directly in SQL
- **`TruncMonth` / `TruncDay`** — truncate timestamps at the database level to group orders by month or day for trend charts
- **`ExtractHour` / `ExtractWeekDay`** — extract hour and day-of-week from timestamps in SQL for the hourly and day-of-week distribution charts
- **`distinct()`** — applied when joining through `OrderItem` back to `Order` to prevent the same order being counted multiple times
>>>>>>> 5aa7fabf6bae384564e873f8b3e09a88ff3ea5a9

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

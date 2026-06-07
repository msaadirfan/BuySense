# BuySense - Data-Driven E-Commerce Platform

BuySense is a full-stack e-commerce application integrated with advanced database management features and a comprehensive seller analytics dashboard. This project fulfills the requirements for both **Web Development** and **Advanced Database Management Systems (ADMS)**.

## 👥 Group Members
- **Muhammad Saad Irfan** (Reg No: 508477)
- *[Add other group members here]*

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

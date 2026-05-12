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

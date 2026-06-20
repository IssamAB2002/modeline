# Modeline

Monorepo with a React frontend built with Vite and a Django backend API.

## Structure

- `frontend/` React + Vite + JavaScript storefront
- `backend/` Django API powering storefront content
- `traditional-store.html` original static concept kept as a reference

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` if your Django server runs somewhere else.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## API

- `GET /api/health/`
- `GET /api/storefront/`


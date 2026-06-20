# Modeline Website - Django Backend

A Django-based backend for the Modeline website project.

## Project Structure

```
backend/
├─ backend/             # Django settings package
├─ apps/                # Reusable business-logic apps
│   ├─ home/
│   ├─ shop/
│   ├─ about/
│   ├─ contact/
│   └─ cart/
├─ fixtures/            # Initial data for loaddata
├─ media/               # User-uploaded files
├─ static/              # Collected static files
├─ templates/           # HTML templates
├─ requirements.txt     # Python dependencies
├─ manage.py            # Django management script
├─ Dockerfile           # Container configuration
├─ docker-compose.yml   # Local development with Postgres + Redis
└─ README.md            # This file
```

## Getting Started

### Prerequisites
- Python 3.11+
- Docker and Docker Compose (for containerized development)
- PostgreSQL and Redis (if not using Docker)

### Local Development with Docker Compose

```bash
# Build and start services
docker-compose up --build

# The Django app will be available at http://localhost:8000
```

### Local Development without Docker

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (copy from docker-compose.yml or create .env)
export DEBUG=1
export DATABASE_URL=postgres://modeline_user:modeline_password@localhost:5432/modeline_db
export REDIS_URL=redis://localhost:6379/0

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## Available Apps

1. **home** - Core homepage and storefront logic
2. **shop** - Product catalogue (list, detail, filters)
3. **about** - About us page content
4. **contact** - Contact form and information
5. **cart** - Shopping cart functionality

## Management Commands

```bash
# Database migrations
python manage.py makemigrations
python manage.py migrate

# Static files
python manage.py collectstatic

# Testing
python manage.py test

# Shell
python manage.py shell

# Superuser
python manage.py createsuperuser
```

## Production Deployment

The included Dockerfile uses Gunicorn as the WSGI server for production deployments.

## License

This project is proprietary and confidential.

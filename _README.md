# ABSS Technical Assessment

This project consists of a Laravel API backend and an Angular frontend for invoice management.

---

## Project Structure

```
├── angular/          # Angular frontend application
├── laravel/          # Laravel API backend
└── __api.md         # API documentation
```

---

## Running the project

First, clone the git repo to your local machine. Then choose either using Docker or Manually setting up the environment.

Using Docker would be ideal as I have set up the environment to run the project

### 📦 Docker (Recommended)

#### Prerequisites

- Docker (Docker Desktop if on Windows)

#### Steps

1. Run `docker-setup.bat` if on Windows, otherwise `docker-setup.sh` if Linux

2. Wait for Docker to build the image and container

3. Access the frontend on http://localhost:4200

### 🔧 Manual setup

#### Prerequisites

Before running this project, ensure you have the following installed:

- **PHP** >= 8.2 with **SQLite extension enabled**

- **Node.js** >= 18.x

- **npm** or **yarn**

- **Composer** (PHP dependency manager)

#### Important: PHP SQLite Extension

Make sure your PHP installation has the SQLite extension enabled. You can check this by running:

```bash
php -m | grep sqlite
```

If SQLite is not listed, you'll need to enable it in your `php.ini` file by uncommenting:

```ini
extension=sqlite3
extension=pdo_sqlite
```

#### Backend Setup (Laravel)

1. Navigate to the Laravel directory

```bash
cd laravel
```

2. Install PHP dependencies

```bash
composer install
```

3. Environment setup

```bash
# Copy the environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

4. Database setup

```bash
# Run database migrations
php artisan migrate:fresh --seed
# You may rerun this same command if want to rebuild the database
```

5. Start the Laravel development server

```bash
php artisan serve
```

The Laravel API will be available at `http://localhost:8000`

#### Frontend Setup (Angular)

1. Navigate to the Angular directory

```bash
cd angular
```

2. Install Node.js dependencies

```bash
npm install
```

3. Start the Angular development server

```bash
npm start
```

The Angular application will be available at `http://localhost:4200`

---

## API Documentation

The API documentation is available in `__api.md`. The API provides endpoints for:

- Managing invoices (CRUD operations)

- Searching invoices

- Managing invoice items

- Pagination and filtering

Base API URL: `http://localhost:8000/api`

---

## Development Workflow

1. Start the Laravel backend server on `http://localhost:8000`

2. Start the Angular frontend server on `http://localhost:4200`

3. The Angular app will communicate with the Laravel API

4. Make changes to either codebase and they will auto-reload
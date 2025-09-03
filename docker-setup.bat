@echo off
echo 🐳 Setting up ABSS Technical Assessment with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

REM Copy environment file for Laravel if it doesn't exist
if not exist ".\laravel\.env" (
    echo 📋 Copying environment file...
    copy ".\laravel\.env.docker" ".\laravel\.env"
)

REM Build Docker images
echo 🏗️ Building Docker images...
docker-compose build

REM Start services
echo 🚀 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Generate Laravel application key
echo 🔑 Generating Laravel application key...
docker-compose exec app php artisan key:generate --force

REM Run database migrations
echo 📊 Running database migrations...
docker-compose exec app php artisan migrate:fresh --force

REM Seed the database
echo 🌱 Seeding database with sample data...
docker-compose exec app php artisan db:seed --force

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Your applications are now running at:
echo    - Laravel API: http://localhost:8000
echo    - Angular Frontend: http://localhost:4200
echo.
echo 📝 Useful commands:
echo    - View logs: docker-compose logs -f
echo    - Stop services: docker-compose down
echo    - Restart services: docker-compose restart
echo.
pause

#!/bin/bash

echo "🐳 Setting up ABSS Technical Assessment with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Copy environment file for Laravel if it doesn't exist
if [ ! -f "./laravel/.env" ]; then
    echo "📋 Copying environment file..."
    cp ./laravel/.env.docker ./laravel/.env
fi

# Build Docker images
echo "🏗️ Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Generate Laravel application key
echo "🔑 Generating Laravel application key..."
docker-compose exec app php artisan key:generate --force

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec app php artisan migrate:fresh --force

# Seed the database
echo "🌱 Seeding database with sample data..."
docker-compose exec app php artisan db:seed --force

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Your applications are now running at:"
echo "   - Laravel API: http://localhost:8000"
echo "   - Angular Frontend: http://localhost:4200"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo ""

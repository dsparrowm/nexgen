#!/bin/bash

# NexGen Backend Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: development, staging, production

set -e

ENVIRONMENT=${1:-development}
PROJECT_NAME="nexgen-backend"

echo "🚀 Deploying $PROJECT_NAME to $ENVIRONMENT environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    print_status "All dependencies are installed"
}

# Setup environment
setup_environment() {
    print_status "Setting up $ENVIRONMENT environment..."

    if [ "$ENVIRONMENT" = "production" ]; then
        if [ ! -f ".env" ]; then
            print_error "Production .env file not found. Please copy .env.production to .env and configure it."
            exit 1
        fi
    fi

    # Create necessary directories
    mkdir -p uploads/kyc logs

    print_status "Environment setup complete"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    pnpm install --frozen-lockfile
    print_status "Dependencies installed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    pnpm run db:migrate
    print_status "Database migrations completed"
}

# Seed database (only for development)
seed_database() {
    if [ "$ENVIRONMENT" = "development" ]; then
        print_status "Seeding database..."
        pnpm run db:seed
        print_status "Database seeded"
    fi
}

# Build application
build_application() {
    print_status "Building application..."
    pnpm run build
    print_status "Application built successfully"
}

# Run tests
run_tests() {
    if [ "$ENVIRONMENT" = "development" ]; then
        print_status "Running tests..."
        pnpm run test
        print_status "Tests completed"
    fi
}

# Deploy with Docker
deploy_with_docker() {
    print_status "Deploying with Docker..."

    # Stop existing containers
    docker-compose down || true

    # Build and start containers
    docker-compose up -d --build

    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30

    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Deployment successful!"
        print_status "Services are running:"
        docker-compose ps
    else
        print_error "Deployment failed. Check logs:"
        docker-compose logs
        exit 1
    fi
}

# Main deployment process
main() {
    print_status "Starting deployment process for $ENVIRONMENT"

    check_dependencies
    setup_environment
    install_dependencies
    run_migrations
    seed_database
    run_tests
    build_application
    deploy_with_docker

    print_status "🎉 Deployment completed successfully!"
    print_status "API available at: http://localhost:8000"
    print_status "Health check: http://localhost:8000/health"
}

# Run main function
main "$@"
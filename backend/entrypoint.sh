#!/bin/sh
set -e

echo "Clearing config..."
php artisan config:clear || true

echo "Running migrations..."
php artisan migrate --force || true

echo "Running seeders..."
php artisan db:seed --force || true

echo "Starting Laravel..."
exec php artisan serve --host=0.0.0.0 --port=$PORT
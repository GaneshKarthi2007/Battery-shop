#!/bin/sh
set -e

echo "Clearing config & cache..."
php artisan config:clear

echo "Running migrations..."
php artisan migrate --force

echo "Running seeders..."
php artisan db:seed --force

echo "Starting Laravel..."
exec php artisan serve --host=0.0.0.0 --port=$PORT
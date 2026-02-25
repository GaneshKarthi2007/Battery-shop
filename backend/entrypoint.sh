#!/bin/sh
set -e

echo "Clearing config & cache..."
php artisan config:clear


echo "Running migrations..."
php artisan migrate:fresh 

echo "Running seeders..."
php artisan db:seed 

echo "Starting Laravel (production)..."
exec php -S 0.0.0.0:$PORT -t public


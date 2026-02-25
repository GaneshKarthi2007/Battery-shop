#!/bin/sh
set -e

# Copy .env if not present
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Generate app key if not set
php artisan key:generate --force

# Run migrations
php artisan migrate --force

# Cache config, routes, and views for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set correct permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Start supervisor (runs nginx + php-fpm + queue)
exec supervisord -c /etc/supervisord.conf

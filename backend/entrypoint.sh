#!/bin/sh
set -e

echo "Clearing config & cache..."
php artisan config:clear


echo "Running migrations..."
php artisan migrate:fresh --force

echo "Running seeders..."
php artisan db:seed --force

echo "Starting Laravel (production)..."
exec php -S 0.0.0.0:$PORT -t public


#!/bin/sh
# set -e

# if [ "$APP_ENV" = "local" ]; then
#   echo "Local environment → migrate:fresh"
#   php artisan migrate:fresh --seed
# else
#   echo "Production environment → migrate"
#   php artisan migrate --force
# fi

# php artisan serve --host=0.0.0.0 --port=${PORT:-10000}

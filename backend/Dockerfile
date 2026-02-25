# --- Base image (Laravel optimized) ---
FROM dunglas/frankenphp:1-php8.2-alpine

WORKDIR /app

# Install system deps
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip

# PHP extensions
RUN install-php-extensions \
    pdo_mysql \
    mbstring \
    bcmath \
    gd \
    xml \
    opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy composer first (cache layer)
COPY composer.json composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy project
COPY . .

# 🔥 Fix Laravel folders BEFORE artisan runs
RUN mkdir -p bootstrap/cache \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    && chmod -R 777 storage bootstrap/cache

# Railway uses PORT env
EXPOSE 8080

# Start Laravel via FrankenPHP
CMD ["frankenphp", "php-server", "--port=8080", "--root=public"]








#  FROM php:8.2-fpm-alpine

# # Install system dependencies
# RUN apk add --no-cache \
#     bash \
#     curl \
#     git \
#     libpng-dev \
#     libjpeg-turbo-dev \
#     freetype-dev \
#     zip \
#     unzip \
#     sqlite \
#     sqlite-dev \
#     oniguruma-dev \
#     libxml2-dev \
#     nginx \
#     supervisor

# # Install PHP extensions
# RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
#     && docker-php-ext-install \
#         pdo \
#         pdo_sqlite \
#         pdo_mysql \
#         mbstring \
#         exif \
#         pcntl \
#         bcmath \
#         gd \
#         xml \
#         opcache

# # Install Composer
# COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# # Set working directory
# WORKDIR /var/www/html

# # Copy composer files first (for layer caching)
# COPY composer.json composer.lock ./

# # Install PHP dependencies (without dev)
# RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# # Copy application source
# COPY . .

# # Run post-install scripts
# RUN composer run-script post-autoload-dump

# # Set permissions for Laravel storage and cache
# RUN mkdir -p storage/framework/{sessions,views,cache} \
#     && mkdir -p storage/logs \
#     && mkdir -p bootstrap/cache \
#     && chown -R www-data:www-data /var/www/html \
#     && chmod -R 775 storage bootstrap/cache

# # Copy nginx config
# COPY docker/nginx.conf /etc/nginx/nginx.conf

# # Copy supervisor config
# COPY docker/supervisord.conf /etc/supervisord.conf

# # Expose port 80
# EXPOSE 80

# # Entrypoint
# COPY docker/entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# ENTRYPOINT ["/entrypoint.sh"]

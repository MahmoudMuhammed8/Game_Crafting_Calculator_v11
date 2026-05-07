FROM php:8.2-apache

# Enable SQLite3 PDO extension
RUN docker-php-ext-install pdo pdo_sqlite

# Set working directory
WORKDIR /var/www/html

# Copy all project files
COPY . /var/www/html/

# Give the web server write access for SQLite DB creation
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Render uses PORT env variable — configure Apache to listen on it
RUN echo 'Listen ${PORT}' > /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-enabled/000-default.conf

# Allow .htaccess overrides (optional, good practice)
RUN sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

EXPOSE ${PORT}

CMD ["apache2-foreground"]

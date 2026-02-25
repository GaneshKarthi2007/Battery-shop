-- PowerCell Battery Shop Management System
-- Comprehensive Database Schema (SQL)

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `email_verified_at` TIMESTAMP NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'staff' COMMENT 'admin, staff',
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `email` VARCHAR(255) PRIMARY KEY,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Inventory / Products
CREATE TABLE IF NOT EXISTS `products` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `brand` VARCHAR(255) NOT NULL,
    `model` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL COMMENT 'Car, Inverter, etc.',
    `ah` VARCHAR(50) NOT NULL COMMENT 'Ampere Hours',
    `price` DECIMAL(15, 2) NOT NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `min_stock` INT NOT NULL DEFAULT 10,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Sales & Transactions
CREATE TABLE IF NOT EXISTS `sales` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_name` VARCHAR(255) NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `sale_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sale_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Service Management
CREATE TABLE IF NOT EXISTS `services` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_name` VARCHAR(255) NOT NULL,
    `vehicle_details` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, in-progress, completed',
    `pickup_date` DATE NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. System Tables (Optional/Standard)
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(255) PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    INDEX (`user_id`),
    INDEX (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Default Data
INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
('Admin User', 'admin@powershell.com', '$2y$10$MTJTSRU7ykHpHZeUKRANbNrm88jvvdGr89VGcVVK', 'admin', NOW(), NOW()),
('Staff User', 'staff@powershell.com', '$2y$10$MTJTSRU7ykHpHZeUKRANbNrm88jvvdGr89VGcVVK', 'staff', NOW(), NOW());

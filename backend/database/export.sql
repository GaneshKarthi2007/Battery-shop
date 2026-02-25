-- PowerCell Battery Shop Management System
-- Unified Database Schema & Initial Data
-- Generated for portability and easy setup

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS `users`;
-- 1. Users Table
CREATE TABLE `users` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `email_verified_at` DATETIME NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'staff',
    `remember_token` VARCHAR(100) NULL,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
);

DROP TABLE IF EXISTS `products`;
-- 2. Products Table
CREATE TABLE `products` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `brand` VARCHAR(255) NOT NULL,
    `model` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `ah` VARCHAR(50) NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `min_stock` INTEGER NOT NULL DEFAULT 10,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
);

DROP TABLE IF EXISTS `sales`;
-- 3. Sales Table
CREATE TABLE `sales` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `customer_name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) DEFAULT 'Sale',
    `customer_phone` VARCHAR(255) NULL,
    `vehicle_details` VARCHAR(255) NULL,
    `installation_address` TEXT NULL,
    `product_category` VARCHAR(255) NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `extra_charges` DECIMAL(15, 2) DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) DEFAULT 0,
    `payment_method` VARCHAR(50) DEFAULT 'Cash',
    `sale_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
);

DROP TABLE IF EXISTS `sale_items`;
-- 4. Sale Items Table
CREATE TABLE `sale_items` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `sale_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `service_id` INTEGER NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL,
    FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
    FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
);

DROP TABLE IF EXISTS `services`;
-- 5. Services Table
CREATE TABLE `services` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `customer_name` VARCHAR(255) NOT NULL,
    `contact_number` VARCHAR(255) NOT NULL,
    `vehicle_details` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'pending',
    `service_charge` DECIMAL(10, 2) DEFAULT 0,
    `battery_brand` VARCHAR(255) NULL,
    `battery_model` VARCHAR(255) NULL,
    `pickup_date` DATE NULL,
    `assigned_to` INTEGER NULL,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
);

DROP TABLE IF EXISTS `notifications`;
-- 6. Notifications Table
CREATE TABLE `notifications` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT 0,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

DROP TABLE IF EXISTS `exchange_records`;
-- 7. Exchange Records Table
CREATE TABLE `exchange_records` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_phone` VARCHAR(255) NULL,
    `customer_address` TEXT NULL,
    `battery_brand` VARCHAR(255) NOT NULL,
    `battery_model` VARCHAR(255) NULL,
    `valuation_amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'pending',
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
);

DROP TABLE IF EXISTS `upi_payments`;
-- 8. UPI Payments Table
CREATE TABLE `upi_payments` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'pending',
    `sale_data` TEXT NULL,
    `invoice_state` TEXT NULL,
    `upi_ref` VARCHAR(255) NULL,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
);

-- 9. Initial Seed Data
-- Password is 'password' (Corrected Bcrypt Hash)
INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
('Admin User', 'admin@powershell.com', '$2y$10$i4A7r9N8ejByePgtK9gy3oKbv0lt7xy1KUGTFq9K', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Staff User', 'staff@powershell.com', '$2y$10$i4A7r9N8ejByePgtK9gy3oKbv0lt7xy1KUGTFq9K', 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO `products` (`brand`, `model`, `type`, `ah`, `price`, `stock`, `min_stock`, `created_at`, `updated_at`) VALUES
('Exide', 'FEP0-EPIQ65D26R', 'Car', '65', 8500.00, 24, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Amaron', 'AAM-PR-00055B24L', 'Car', '45', 6200.00, 18, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Luminous', 'ILTT 18048', 'Inverter', '150', 14500.00, 12, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Okaya', 'XL-5000T', 'Inverter', '100', 9800.00, 4, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Exide', 'IT 500', 'Inverter', '200', 18500.00, 2, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Amaron', 'Quanta 12AL165', 'Inverter', '165', 16200.00, 10, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SF Sonic', 'FFSO-FS1800-145', 'Inverter', '145', 12800.00, 20, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Livguard', 'LGSTPRO180ST', 'Inverter', '180', 15600.00, 14, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

PRAGMA foreign_keys = ON;

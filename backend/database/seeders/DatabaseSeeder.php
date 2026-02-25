<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@powershell.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // Create Staff User
        User::factory()->create([
            'name' => 'Staff User',
            'email' => 'staff@powershell.com',
            'password' => bcrypt('password'),
            'role' => 'staff',
        ]);

        // Seed Products
        $products = [
            [
                'brand' => 'Exide',
                'model' => 'FEP0-EPIQ65D26R',
                'ah' => '65',
                'type' => 'Car',
                'stock' => 24,
                'min_stock' => 10,
                'price' => 8500,
            ],
            [
                'brand' => 'Amaron',
                'model' => 'AAM-PR-00055B24L',
                'ah' => '45',
                'type' => 'Car',
                'stock' => 18,
                'min_stock' => 15,
                'price' => 6200,
            ],
            [
                'brand' => 'Luminous',
                'model' => 'ILTT 18048',
                'ah' => '150',
                'type' => 'Inverter',
                'stock' => 12,
                'min_stock' => 8,
                'price' => 14500,
            ],
            [
                'brand' => 'Okaya',
                'model' => 'XL-5000T',
                'ah' => '100',
                'type' => 'Inverter',
                'stock' => 4,
                'min_stock' => 12,
                'price' => 9800,
            ],
            [
                'brand' => 'Exide',
                'model' => 'IT 500',
                'ah' => '200',
                'type' => 'Inverter',
                'stock' => 2,
                'min_stock' => 8,
                'price' => 18500,
            ],
            [
                'brand' => 'Amaron',
                'model' => 'Quanta 12AL165',
                'ah' => '165',
                'type' => 'Inverter',
                'stock' => 10,
                'min_stock' => 10,
                'price' => 16200,
            ],
            [
                'brand' => 'SF Sonic',
                'model' => 'FFSO-FS1800-145',
                'ah' => '145',
                'type' => 'Inverter',
                'stock' => 20,
                'min_stock' => 15,
                'price' => 12800,
            ],
            [
                'brand' => 'Livguard',
                'model' => 'LGSTPRO180ST',
                'ah' => '180',
                'type' => 'Inverter',
                'stock' => 14,
                'min_stock' => 10,
                'price' => 15600,
            ],
        ];

        foreach ($products as $product) {
            \App\Models\Product::create($product);
        }

        // Seed Services
        $services = [
            [
                'customer_name' => 'Rajesh Kumar',
                'contact_number' => '9876543210',
                'vehicle_details' => 'Toyota Fortuner',
                'status' => 'pending',
            ],
            [
                'customer_name' => 'Priya Sharma',
                'contact_number' => '9123456780',
                'vehicle_details' => 'Honda City',
                'status' => 'pending',
                'pickup_date' => now()->addDays(2),
            ],
        ];

        foreach ($services as $service) {
            \App\Models\Service::create($service);
        }
    }
}

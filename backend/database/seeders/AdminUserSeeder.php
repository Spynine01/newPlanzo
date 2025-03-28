<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@planzo.com',
            'password' => Hash::make('admin123'),
            'is_admin' => true,
        ]);

        // Create a wallet for the admin user
        Wallet::create([
            'user_id' => $admin->id,
            'coins' => 1000, // Give admin a starting balance
            'total_spent' => 0,
        ]);

        $this->command->info('Admin user created with email: admin@planzo.com and password: admin123');
    }
}

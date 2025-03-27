<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@planzo.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'coins' => 10000 // Give admin some initial coins
        ]);
    }
} 
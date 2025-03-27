<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::beginTransaction();

        try {
            $admin = User::create([
                'name' => 'Admin',
                'email' => 'admin@planzo.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'preferences' => json_encode(['all'])
            ]);

            // Create wallet for admin
            Wallet::create([
                'user_id' => $admin->id,
                'balance' => 0,
                'coins' => 100 // Give admin some initial coins
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

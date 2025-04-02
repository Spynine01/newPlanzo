<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class UpdateUserRoles extends Command
{
    protected $signature = 'users:update-roles';
    protected $description = 'Update roles for all users';

    public function handle()
    {
        // Update admin users
        User::where('is_admin', true)->update(['role' => 'admin']);
        
        // Update organizer users
        User::where('is_organizer', true)->update(['role' => 'organizer']);
        
        // Update regular users
        User::where('is_admin', false)
            ->where('is_organizer', false)
            ->update(['role' => 'user']);

        $this->info('User roles have been updated successfully.');
    }
} 
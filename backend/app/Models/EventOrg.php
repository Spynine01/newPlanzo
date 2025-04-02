<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; 
use Laravel\Sanctum\HasApiTokens; // ✅ Add this

class EventOrg extends Authenticatable { // ✅ Change from Model to Authenticatable
    use HasFactory, HasApiTokens; // ✅ Use HasApiTokens

    protected $table = 'event_org';

    protected $casts = [
        'isVerified' => 'boolean',
    ];

    protected $fillable = ['name', 'email', 'password', 'pdf_path', 'isVerified'];
}
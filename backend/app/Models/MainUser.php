<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MainUser extends Model
{
    use HasFactory;

    protected $table = 'main_users';

    protected $fillable = ['email', 'password', 'preferences'];

    protected $casts = [
        'preferences' => 'array', // Auto-convert JSON to array when fetching
    ];

}

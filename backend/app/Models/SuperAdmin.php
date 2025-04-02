<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuperAdmin extends Model
{
    use HasFactory;

    protected $table = 'super_admin'; // Ensure it matches your table name

    protected $fillable = ['user', 'password']; // Allow mass assignment
}

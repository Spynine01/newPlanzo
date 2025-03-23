<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventOrg extends Model {
    use HasFactory;

    protected $table = 'event_org';

    protected $fillable = ['name', 'email', 'password', 'pdf_path', 'isVerified'];
}
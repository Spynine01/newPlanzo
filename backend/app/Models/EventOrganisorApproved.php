<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventOrganisorApproved extends Model
{
    use HasFactory;

    protected $table = 'event_organisor_approved';

    protected $fillable = ['email', 'password'];


}

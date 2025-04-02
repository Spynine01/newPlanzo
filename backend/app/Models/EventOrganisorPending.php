<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Jenssegers\Mongodb\Eloquent\Model;


class EventOrganisorPending extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'event_organizers'; // Collection name in MongoDB

    protected $fillable = [
        'name', 'email', 'password', 'pdf_url'
    ];
}

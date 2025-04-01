<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model;

class Recommendation extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'recommendations';

    protected $fillable = [
        'organizerId',
        'eventData',
        'recommendationType',
        'recommendationText',
        'status',
        'responseText',
        'temp_id'
    ];

    protected $dates = ['created_at', 'updated_at'];

    // Use MongoDB's ObjectId
    protected $primaryKey = '_id';
    protected $keyType = 'string';
    public $incrementing = false;
} 
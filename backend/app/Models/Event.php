<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'category',
        'date',
        'time',
        'location',
        'venue',
        'address',
        'price',
        'available_tickets',
        'image_url',
        'organizer_id'
    ];

    protected $casts = [
        'date' => 'date',
        'price' => 'decimal:2',
        'available_tickets' => 'integer'
    ];

    /**
     * Get the organizer that owns the event.
     */
    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * Get the recommendations for this event.
     */
    public function recommendations()
    {
        return $this->hasMany(AdminRecommendation::class);
    }
}

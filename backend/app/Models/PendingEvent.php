<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PendingEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'category',
        'location',
        'price',
        'available_tickets',
        'date',
        'time',
        'venue',
        'status'
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime',
        'price' => 'decimal:2',
        'available_tickets' => 'integer'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(AdminRecommendation::class, 'event_id');
    }

    public function toEvent(): Event
    {
        $event = new Event();
        $event->fill($this->only([
            'user_id',
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
            'image'
        ]));
        return $event;
    }
}

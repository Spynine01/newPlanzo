<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminRecommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'type',
        'recommendation',
        'status',
        'admin_notes'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected $with = ['event']; // Always load the event relationship

    public function event(): BelongsTo
    {
        return $this->belongsTo(PendingEvent::class, 'event_id');
    }

    public function approve(): void
    {
        $this->status = 'approved';
        $this->save();
    }

    public function reject(): void
    {
        $this->status = 'rejected';
        $this->save();
    }
}

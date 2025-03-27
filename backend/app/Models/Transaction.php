<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_id',
        'type',
        'amount',
        'coins',
        'platform_fee',
        'status',
        'description',
        'details'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'coins' => 'integer',
        'details' => 'array'
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function adminRecommendation(): HasOne
    {
        return $this->hasOne(AdminRecommendation::class);
    }

    public function calculatePlatformFee(): float
    {
        return $this->amount * 0.05; // 5% platform fee
    }

    public function calculateCoins(): int
    {
        $amountAfterFee = $this->amount - $this->platform_fee;
        return (int) ($amountAfterFee / 10); // 1 coin = 10 rupees
    }
}

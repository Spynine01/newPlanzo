<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'coins',
        'total_spent'
    ];

    protected $casts = [
        'coins' => 'integer',
        'total_spent' => 'decimal:2'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function addCoins(int $coins, float $amount = 0, float $platformFee = 0): void
    {
        $this->coins += $coins;
        $this->total_spent += $amount + $platformFee;
        $this->save();
    }

    public function deductCoins(int $coins): bool
    {
        if ($this->coins < $coins) {
            return false;
        }

        $this->coins -= $coins;
        $this->save();
        return true;
    }

    public function hasEnoughCoins(int $coins): bool
    {
        return $this->coins >= $coins;
    }
}

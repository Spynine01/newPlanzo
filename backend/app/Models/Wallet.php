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
        'balance',
        'coins'
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'coins' => 'integer'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function addCoins(int $coins, float $amount, float $platformFee = 0): void
    {
        $this->balance += $amount;
        $this->coins += $coins;
        $this->save();
    }

    public function deductCoins(int $coins): bool
    {
        if ($this->coins >= $coins) {
            $this->coins -= $coins;
            $this->save();
            return true;
        }
        return false;
    }
}

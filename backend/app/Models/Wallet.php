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

    public function addCoins(int $amount, float $balance, float $platformFee = 0): void
    {
        $this->balance += $balance;
        $this->coins += $amount;
        $this->save();
    }

    public function deductCoins(int $amount): bool
    {
        if ($this->coins >= $amount) {
            $this->coins -= $amount;
            $this->save();
            return true;
        }
        return false;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function show()
    {
        $wallet = auth()->user()->wallet;
        $transactions = $wallet->transactions()->latest()->get();
        return response()->json([
            'wallet' => $wallet,
            'transactions' => $transactions
        ]);
    }

    public function topUp(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        $amount = $request->amount;
        $platformFee = $amount * 0.05; // 5% platform fee
        $coins = (int) (($amount - $platformFee) * 10); // 1 USD = 10 coins

        try {
            DB::beginTransaction();

            $transaction = Transaction::create([
                'wallet_id' => auth()->user()->wallet->id,
                'type' => 'top_up',
                'amount' => $amount,
                'coins' => $coins,
                'platform_fee' => $platformFee,
                'status' => 'completed',
                'details' => [
                    'conversion_rate' => 10,
                    'original_amount' => $amount
                ]
            ]);

            auth()->user()->wallet->addCoins($coins, $amount, $platformFee);

            DB::commit();

            return response()->json([
                'message' => 'Wallet topped up successfully',
                'transaction' => $transaction,
                'new_balance' => auth()->user()->wallet->coins
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to top up wallet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function requestRecommendation(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'type' => 'required|in:category,location,pricing',
            'coins' => 'required|integer|min:1'
        ]);

        $wallet = auth()->user()->wallet;

        if ($wallet->coins < $request->coins) {
            return response()->json([
                'message' => 'Insufficient coins'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $transaction = Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'recommendation_request',
                'amount' => 0,
                'coins' => $request->coins,
                'platform_fee' => 0,
                'status' => 'completed',
                'details' => [
                    'event_id' => $request->event_id,
                    'request_type' => $request->type
                ]
            ]);

            $wallet->deductCoins($request->coins);

            DB::commit();

            return response()->json([
                'message' => 'Recommendation request submitted successfully',
                'transaction' => $transaction,
                'new_balance' => $wallet->coins
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to submit recommendation request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

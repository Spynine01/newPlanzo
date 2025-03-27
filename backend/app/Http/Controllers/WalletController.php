<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\AdminRecommendation;
use App\Models\PendingEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function getWallet()
    {
        try {
            $user = auth()->user();
            $wallet = $user->wallet;

            if (!$wallet) {
                // Create a new wallet if it doesn't exist
                $wallet = Wallet::create([
                    'user_id' => $user->id,
                    'coins' => 0,
                    'total_spent' => 0
                ]);
            }

            $transactions = $wallet->transactions()->latest()->get();
            return response()->json([
                'wallet' => $wallet,
                'transactions' => $transactions
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get wallet: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to get wallet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getTransactions()
    {
        try {
            $user = auth()->user();
            $wallet = $user->wallet;

            if (!$wallet) {
                // Create a new wallet if it doesn't exist
                $wallet = Wallet::create([
                    'user_id' => $user->id,
                    'coins' => 0,
                    'total_spent' => 0
                ]);
            }

            $transactions = $wallet->transactions()
                ->with('wallet.user')
                ->latest()
                ->get();

            return response()->json($transactions);
        } catch (\Exception $e) {
            \Log::error('Failed to get transactions: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch transactions',
                'error' => $e->getMessage()
            ], 500);
        }
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
        try {
            $request->validate([
                'type' => 'required|string|in:location,venue,tickets,category,pricing'
            ]);

            $user = $request->user();
            $wallet = $user->wallet;

            if (!$wallet) {
                return response()->json([
                    'message' => 'Wallet not found for user'
                ], 400);
            }

            if ($wallet->coins < 10) {
                return response()->json([
                    'message' => 'Insufficient coins. Please top up your wallet.'
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Get or create pending event for this user
                $pendingEvent = PendingEvent::firstOrCreate(
                    ['user_id' => $user->id, 'status' => 'pending'],
                    []
                );

                // Create recommendation
                $recommendation = AdminRecommendation::create([
                    'event_id' => $pendingEvent->id,
                    'type' => $request->type,
                    'status' => 'pending',
                    'recommendation' => $this->getDefaultRecommendation($request->type)
                ]);

                // Create transaction
                $transaction = Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'recommendation',
                    'amount' => -10,
                    'coins' => -10,
                    'platform_fee' => 0,
                    'status' => 'completed',
                    'description' => ucfirst($request->type) . ' recommendation request',
                    'details' => [
                        'recommendation_id' => $recommendation->id,
                        'event_id' => $pendingEvent->id,
                        'type' => $request->type
                    ]
                ]);

                // Update wallet balance
                $wallet->coins -= 10;
                $wallet->save();

                DB::commit();

                return response()->json([
                    'message' => 'Recommendation requested successfully',
                    'balance' => $wallet->coins,
                    'pending_event_id' => $pendingEvent->id,
                    'recommendation' => $recommendation
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            \Log::error('Recommendation request error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Failed to request recommendation: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getDefaultRecommendation($type)
    {
        switch ($type) {
            case 'category':
                return 'Analyzing event details to suggest the most appropriate category...';
            case 'location':
                return 'Evaluating location options based on event type and target audience...';
            case 'pricing':
                return 'Analyzing market rates and event features to suggest optimal pricing...';
            case 'venue':
                return 'Reviewing venue options based on event requirements and expected attendance...';
            case 'tickets':
                return 'Calculating recommended ticket allocation based on venue capacity and demand...';
            default:
                return 'Processing recommendation request...';
        }
    }
}

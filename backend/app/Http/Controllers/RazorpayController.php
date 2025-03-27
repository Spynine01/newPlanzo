<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Razorpay\Api\Api;
use Illuminate\Support\Facades\Log;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Event;
use App\Models\Ticket;
use Illuminate\Support\Facades\DB;

class RazorpayController extends Controller
{
    private $razorpay;

    public function __construct()
    {
        $this->razorpay = new Api(
            'rzp_test_wXLpFjTApTfVvX',
            'RW2ABtUCx0zjyooj3dltBLVk'
        );
    }

    public function createOrder(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'type' => 'required|in:wallet,ticket',
                'event_id' => 'required_if:type,ticket|exists:events,id',
                'quantity' => 'required_if:type,ticket|integer|min:1'
            ]);

            Log::info('Creating Razorpay order with details:', [
                'amount' => $request->amount,
                'type' => $request->type,
                'event_id' => $request->event_id,
                'quantity' => $request->quantity
            ]);
            
            if ($request->type === 'ticket') {
                // Verify event exists and has enough tickets
                $event = Event::findOrFail($request->event_id);
                if ($event->available_tickets < $request->quantity) {
                    return response()->json([
                        'error' => 'Not enough tickets available'
                    ], 400);
                }
            }
            
            $orderData = [
                'amount' => $request->amount, // Amount is already in paise from frontend
                'currency' => 'INR',
                'receipt' => 'rcpt_' . time(),
                'notes' => [
                    'type' => $request->type,
                    'user_id' => auth()->id(),
                    'event_id' => $request->event_id,
                    'quantity' => $request->quantity,
                    'amount_in_paise' => $request->amount // Store original amount for verification
                ]
            ];

            Log::info('Sending order request to Razorpay:', $orderData);
            
            try {
                $order = $this->razorpay->order->create($orderData);
                Log::info('Razorpay order created successfully:', ['order' => $order]);

                if (empty($order->id)) {
                    throw new \Exception('Invalid order response from Razorpay');
                }

                return response()->json([
                    'key' => config('services.razorpay.key'),
                    'amount' => $orderData['amount'],
                    'currency' => $orderData['currency'],
                    'name' => 'Planzo',
                    'description' => $request->type === 'wallet' ? 'Wallet Top Up' : 'Event Ticket Purchase',
                    'order_id' => $order->id,
                    'prefill' => [
                        'name' => auth()->user()->name,
                        'email' => auth()->user()->email
                    ]
                ]);
            } catch (\Razorpay\Api\Errors\Error $e) {
                Log::error('Razorpay API Error:', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                return response()->json([
                    'error' => 'Failed to create Razorpay order: ' . $e->getMessage()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Order creation failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to process order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function verifyPayment(Request $request)
    {
        try {
            Log::info('Verifying payment: ' . json_encode($request->all()));

            $request->validate([
                'razorpay_signature' => 'required|string',
                'razorpay_payment_id' => 'required|string',
                'razorpay_order_id' => 'required|string',
                'amount' => 'required|numeric'
            ]);

            $attributes = [
                'razorpay_signature' => $request->razorpay_signature,
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'razorpay_order_id' => $request->razorpay_order_id
            ];

            $this->razorpay->utility->verifyPaymentSignature($attributes);

            // Get the original order
            $order = $this->razorpay->order->fetch($request->razorpay_order_id);
            $notes = $order->notes;

            // Amount is in paise, convert to rupees for our calculations
            $amountInRupees = $request->amount / 100;
            
            // Store payment details based on type
            if ($notes['type'] === 'wallet') {
                DB::transaction(function () use ($request, $notes, $amountInRupees) {
                    // Get user's wallet
                    $wallet = Wallet::where('user_id', auth()->id())->firstOrFail();
                    
                    // Calculate platform fee (5%)
                    $platformFee = $amountInRupees * 0.05;
                    
                    // Calculate coins (1 coin = 10 rupees)
                    $baseAmount = $amountInRupees - $platformFee;
                    $coins = (int) ($baseAmount / 10);
                    
                    // Create transaction
                    $transaction = Transaction::create([
                        'wallet_id' => $wallet->id,
                        'type' => 'credit',
                        'amount' => $amountInRupees,
                        'coins' => $coins,
                        'platform_fee' => $platformFee,
                        'status' => 'completed',
                        'payment_id' => $request->razorpay_payment_id,
                        'order_id' => $request->razorpay_order_id,
                        'description' => 'Wallet Top Up'
                    ]);

                    // Update wallet balance
                    $wallet->coins += $coins;
                    $wallet->total_spent += $amountInRupees;
                    $wallet->save();

                    Log::info('Wallet updated successfully', [
                        'wallet_id' => $wallet->id,
                        'amount_in_rupees' => $amountInRupees,
                        'platform_fee' => $platformFee,
                        'base_amount' => $baseAmount,
                        'coins_added' => $coins,
                        'new_coins' => $wallet->coins,
                        'total_spent' => $wallet->total_spent,
                        'payment_id' => $request->razorpay_payment_id,
                        'transaction_id' => $transaction->id
                    ]);
                });
            } else if ($notes['type'] === 'ticket') {
                DB::transaction(function () use ($request, $notes, $amountInRupees) {
                    // Get the event
                    $event = Event::findOrFail($notes['event_id']);
                    
                    // Check if enough tickets are available
                    if ($event->available_tickets < $notes['quantity']) {
                        throw new \Exception('Not enough tickets available');
                    }

                    // Create tickets
                    for ($i = 0; $i < $notes['quantity']; $i++) {
                        Ticket::create([
                            'event_id' => $notes['event_id'],
                            'user_id' => auth()->id(),
                            'payment_id' => $request->razorpay_payment_id,
                            'order_id' => $request->razorpay_order_id,
                            'status' => 'confirmed',
                            'price' => $amountInRupees / $notes['quantity']
                        ]);
                    }

                    // Update available tickets
                    $event->available_tickets -= $notes['quantity'];
                    $event->save();

                    Log::info('Tickets created successfully', [
                        'event_id' => $notes['event_id'],
                        'quantity' => $notes['quantity'],
                        'payment_id' => $request->razorpay_payment_id
                    ]);
                });
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully',
                'type' => $notes['type'],
                'amount' => $amountInRupees
            ]);
        } catch (\Exception $e) {
            Log::error('Payment verification failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed: ' . $e->getMessage()
            ], 400);
        }
    }
} 
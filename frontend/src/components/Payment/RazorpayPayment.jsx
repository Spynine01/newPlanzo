import React, { useEffect } from 'react';
import { Button } from '../ui/Button';
import { walletApi } from '../../services/api';

const RazorpayPayment = ({ amount = 500, onSuccess, onFailure, type = 'wallet', event_id, quantity = 1 }) => {
  useEffect(() => {
    const loadRazorpay = async () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
      };
      
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        onFailure('Failed to load payment gateway');
      };
      
      document.body.appendChild(script);
    };

    loadRazorpay();

    return () => {
      const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [onFailure]);

  const initializePayment = async () => {
    try {
      if (!window.Razorpay) {
        throw new Error('Payment gateway not loaded');
      }

      // Create order with amount in paise
      const orderData = {
        amount: amount, // Already in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        type,
        ...(type === 'ticket' && {
          event_id,
          quantity
        })
      };

      console.log('Creating order with data:', orderData);
      const orderResponse = await walletApi.createOrder(orderData);
      
      if (!orderResponse.data || !orderResponse.data.key || !orderResponse.data.order_id) {
        throw new Error('Invalid order response from server');
      }

      // Initialize Razorpay with proper options
      const options = {
        key: orderResponse.data.key,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: 'Planzo',
        description: type === 'wallet' ? 'Wallet Top Up' : 'Event Ticket Purchase',
        order_id: orderResponse.data.order_id,
        handler: async function (response) {
          try {
            // Verify payment with all required fields
            const verificationData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: orderResponse.data.amount, // Use the original amount from order
              type: type,
              ...(type === 'ticket' && {
                event_id,
                quantity
              })
            };

            console.log('Verifying payment with data:', verificationData);
            const verificationResponse = await walletApi.verifyPayment(verificationData);

            if (verificationResponse.data.success) {
              onSuccess({
                ...verificationResponse.data,
                type,
                amount: orderResponse.data.amount / 100
              });
            } else {
              throw new Error(verificationResponse.data.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onFailure(error.response?.data?.message || error.message || 'Payment verification failed');
          }
        },
        prefill: orderResponse.data.prefill || {
          name: localStorage.getItem('userName') || 'User',
          email: localStorage.getItem('userEmail') || 'user@example.com',
          contact: ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            onFailure('Payment cancelled by user');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        onFailure(response.error.description || 'Payment failed');
      });
      razorpay.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      onFailure(error.response?.data?.message || error.message || 'Failed to initialize payment');
    }
  };

  return (
    <Button 
      onClick={initializePayment}
      className="w-full"
    >
      Pay ₹{(amount / 100).toLocaleString('en-IN')}
    </Button>
  );
};

export default RazorpayPayment; 
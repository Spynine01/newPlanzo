<!DOCTYPE html>
<html>
<head>
    <title>Test Razorpay Payment</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        .error-message {
            color: red;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Test Razorpay Payment</h1>
    <input type="text" id="token-input" placeholder="Paste your auth token here" style="width: 300px;">
    <button id="pay-button" disabled>Pay ₹500</button>
    <div id="error-message" class="error-message"></div>

    <script>
        // Enable the pay button when token is entered
        document.getElementById('token-input').addEventListener('input', function() {
            document.getElementById('pay-button').disabled = !this.value;
            document.getElementById('error-message').textContent = '';
        });

        document.getElementById('pay-button').onclick = async function() {
            try {
                const token = document.getElementById('token-input').value;
                const errorDiv = document.getElementById('error-message');
                errorDiv.textContent = '';
                
                // First, create an order
                const response = await fetch('http://127.0.0.1:8000/api/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + token,
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        amount: 500,
                        type: 'wallet'
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to create order');
                }

                if (!data.order_id) {
                    throw new Error('Invalid order response');
                }

                console.log('Order created:', data);
                
                const options = {
                    key: data.key,
                    amount: data.amount,
                    currency: data.currency,
                    name: data.name,
                    description: data.description,
                    order_id: data.order_id,
                    prefill: data.prefill,
                    handler: async function(response) {
                        try {
                            // Handle the success payment
                            console.log('Payment successful:', response);
                            
                            // Verify the payment
                            const verifyResponse = await fetch('http://127.0.0.1:8000/api/verify-payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Authorization': 'Bearer ' + token,
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                                },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    type: 'wallet',
                                    amount: 500
                                })
                            });

                            const verifyData = await verifyResponse.json();
                            console.log('Payment verification:', verifyData);
                            
                            if (!verifyResponse.ok) {
                                throw new Error(verifyData.error || 'Payment verification failed');
                            }
                            
                            alert('Payment successful! Check console for details.');
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            errorDiv.textContent = error.message;
                        }
                    },
                    theme: {
                        color: "#3399cc"
                    }
                };

                const rzp1 = new Razorpay(options);
                rzp1.open();
            } catch (error) {
                console.error('Payment error:', error);
                document.getElementById('error-message').textContent = error.message;
            }
        };
    </script>
</body>
</html> 
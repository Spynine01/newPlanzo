import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import RazorpayPayment from '../components/Payment/RazorpayPayment';
import api from '../services/api';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desiredCoins, setDesiredCoins] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.get('/wallet');
      setWallet(response.data.wallet);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load wallet data');
      }
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await api.get('/wallet/transactions');
      setTransactions(response.data || []); // Handle direct array response
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      await fetchWalletData();
      await fetchTransactions();
      setError(null);
      setDesiredCoins('');
    } catch (err) {
      console.error('Error updating wallet after payment:', err);
      setError('Failed to update wallet data after payment');
    }
  };

  const handlePaymentFailure = (error) => {
    setError(typeof error === 'string' ? error : 'Payment failed. Please try again.');
  };

  const calculateAmount = (coins) => {
    // Calculate base amount needed for desired coins (1 coin = 10 rupees)
    const baseAmount = coins * 10;
    // Add 5% platform fee
    const platformFee = baseAmount * 0.05;
    const totalAmount = baseAmount + platformFee;
    return {
      baseAmount,
      platformFee,
      totalAmount
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading && !wallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load wallet data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-500 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { baseAmount, platformFee, totalAmount } = calculateAmount(Number(desiredCoins) || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your coins and view transaction history</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Coins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {wallet.coins} coins
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Balance: {formatAmount(wallet.balance)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Coins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Coins
                  </label>
                  <input
                    type="number"
                    value={desiredCoins}
                    onChange={(e) => setDesiredCoins(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of coins"
                    min="1"
                  />
                </div>
                {desiredCoins && Number(desiredCoins) > 0 && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Base Amount: {formatAmount(baseAmount)}</p>
                    <p>Platform Fee (5%): {formatAmount(platformFee)}</p>
                    <p className="font-semibold">Total Amount: {formatAmount(totalAmount)}</p>
                  </div>
                )}
                {desiredCoins && Number(desiredCoins) > 0 && (
                  <RazorpayPayment
                    amount={totalAmount * 100} // Convert to paise
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                    type="wallet"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions found</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.type === 'credit' ? 'Wallet Top Up' : 'Purchase'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </p>
                      {transaction.coins > 0 && (
                        <p className="text-sm text-blue-600">
                          +{transaction.coins} coins
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </p>
                      {transaction.platform_fee > 0 && (
                        <p className="text-xs text-gray-500">
                          Fee: {formatAmount(transaction.platform_fee)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet; 
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { walletApi } from '../services/api';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpForm, setShowTopUpForm] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await walletApi.getWallet();
      setWallet(response.data.wallet);
    } catch (err) {
      setError('Failed to load wallet data');
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await walletApi.getTransactions();
      setTransactions(response.data.transactions);
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(topUpAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const response = await walletApi.topUp(amount);
      setWallet(response.data.wallet);
      setTransactions(prev => [response.data.transaction, ...prev]);
      setTopUpAmount('');
      setShowTopUpForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to top up wallet');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your wallet balance and view transaction history</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {wallet ? formatAmount(wallet.balance) : 'Loading...'}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Available Coins: {wallet?.coins || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {!showTopUpForm ? (
                <Button
                  variant="primary"
                  onClick={() => setShowTopUpForm(true)}
                  className="w-full"
                >
                  Top Up Wallet
                </Button>
              ) : (
                <form onSubmit={handleTopUp} className="space-y-4">
                  <Input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTopUpForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Top Up'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
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
                        {transaction.type === 'top_up' ? 'Wallet Top Up' : 'Recommendation Request'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'top_up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'top_up' ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </p>
                      {transaction.type === 'recommendation' && (
                        <p className="text-sm text-gray-500">
                          {transaction.coins} coins
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
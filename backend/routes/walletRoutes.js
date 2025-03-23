const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get wallet details
router.get('/wallet', auth, async (req, res) => {
  try {
    // TODO: Get wallet details from database
    res.json({
      wallet: {
        balance: 0,
        coins: 0
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet details' });
  }
});

// Get wallet transactions
router.get('/wallet/transactions', auth, async (req, res) => {
  try {
    // TODO: Get transactions from database
    res.json({
      transactions: []
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Top up wallet
router.post('/wallet/top-up', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    // TODO: Update wallet balance in database
    res.json({
      wallet: {
        balance: amount,
        coins: Math.floor(amount / 10) // 1 coin per 10 rupees
      },
      transaction: {
        id: Date.now(),
        type: 'top_up',
        amount: amount,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error topping up wallet:', error);
    res.status(500).json({ error: 'Failed to top up wallet' });
  }
});

module.exports = router; 
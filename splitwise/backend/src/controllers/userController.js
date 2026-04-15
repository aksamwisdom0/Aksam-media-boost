const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          balance: user.balance,
          role: user.role,
          phone: user.phone,
          country: user.country,
          preferences: user.preferences,
          apiUsage: user.apiUsage,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user balance (admin only)
const updateBalance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId, amount, type, description } = req.body;
    const adminId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create transaction
    const transaction = await Transaction.createTransaction({
      user: userId,
      type,
      amount: parseFloat(amount),
      description: description || `Balance adjustment by admin`,
      metadata: { source: 'admin', adminId }
    });

    res.json({
      success: true,
      message: 'Balance updated successfully',
      data: {
        newBalance: user.balance,
        transaction
      }
    });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get user order history
const getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user.id;

    const orders = await Order.getUserOrders(
      userId,
      parseInt(page),
      parseInt(limit),
      status
    );

    const totalOrders = await Order.countDocuments({ 
      user: userId,
      ...(status && { status })
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          hasNext: parseInt(page) < Math.ceil(totalOrders / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user transactions
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const userId = req.user.id;

    const transactions = await Transaction.getUserTransactions(
      userId,
      parseInt(page),
      parseInt(limit),
      type
    );

    const totalTransactions = await Transaction.countDocuments({ 
      user: userId,
      ...(type && { type })
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTransactions / parseInt(limit)),
          totalTransactions,
          hasNext: parseInt(page) < Math.ceil(totalTransactions / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user statistics
const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Get order statistics
    const orderStats = await Order.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
          ...(endDate && { createdAt: { $lte: new Date(endDate) } })
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSpent: { $sum: '$charge' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Get transaction statistics
    const transactionStats = await Transaction.getStatistics(
      userId,
      startDate,
      endDate
    );

    // Get user details
    const user = await User.findById(userId);

    res.json({
      success: true,
      data: {
        user: {
          balance: user.balance,
          totalOrders: user.apiUsage.totalOrders,
          totalSpent: user.apiUsage.totalSpent
        },
        orderStats,
        transactionStats
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add funds to wallet
const addFunds = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { amount, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;

    // Create pending transaction
    const transaction = await Transaction.create({
      user: userId,
      type: 'deposit',
      amount: parseFloat(amount),
      description: `Funds deposit via ${paymentMethod}`,
      paymentMethod,
      paymentDetails,
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });

    // Here you would integrate with actual payment gateway
    // For now, we'll simulate successful payment
    setTimeout(async () => {
      try {
        const user = await User.findById(userId);
        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + parseFloat(amount);
        
        user.balance = balanceAfter;
        await user.save();
        
        transaction.status = 'completed';
        transaction.balanceBefore = balanceBefore;
        transaction.balanceAfter = balanceAfter;
        await transaction.save();
      } catch (error) {
        console.error('Payment processing error:', error);
      }
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Deposit initiated successfully',
      data: {
        transaction,
        redirectUrl: `/payment/confirm/${transaction._id}`
      }
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Withdraw funds
const withdrawFunds = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { amount, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user.balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create withdrawal transaction
    const transaction = await Transaction.createTransaction({
      user: userId,
      type: 'withdraw',
      amount: parseFloat(amount),
      description: `Funds withdrawal via ${paymentMethod}`,
      paymentMethod,
      paymentDetails,
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Withdraw funds error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateBalance,
  getOrderHistory,
  getTransactions,
  getStatistics,
  addFunds,
  withdrawFunds
};

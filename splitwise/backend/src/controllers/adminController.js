const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersToday = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const failedOrders = await Order.countDocuments({ status: 'failed' });

    // Get revenue statistics
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['completed', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$charge' } } }
    ]);

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'partial'] },
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$charge' } } }
    ]);

    // Get service statistics
    const totalServices = await Service.countDocuments({ isActive: true });
    const popularServices = await Service.find({ isActive: true, isPopular: true }).countDocuments();

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'email firstName lastName')
      .populate('service', 'name category')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('user', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get monthly revenue for the last 6 months
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'partial'] },
          createdAt: {
            $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$charge' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          failed: failedOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
          monthly: monthlyRevenue
        },
        services: {
          total: totalServices,
          popular: popularServices
        },
        recentOrders,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;

    // Build query
    const query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / parseInt(limit)),
          totalUsers,
          hasNext: parseInt(page) < Math.ceil(totalUsers / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all orders with filters
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId, serviceId, startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (serviceId) query.service = serviceId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'email firstName lastName')
      .populate('service', 'name category')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

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
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, userId, status, startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (type) query.type = type;
    if (userId) query.user = userId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'email firstName lastName')
      .populate('relatedOrder', 'serviceDetails.name quantity')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalTransactions = await Transaction.countDocuments(query);

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
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    let days = 30;
    if (period === '7d') days = 7;
    if (period === '1d') days = 1;
    if (period === '90d') days = 90;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get order statistics
    const orderStats = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$charge' }
        }
      }
    ]);

    // Get transaction statistics
    const transactionStats = await Transaction.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Get service performance
    const serviceStats = await Service.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'service',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          orderCount: { $size: '$orders' },
          totalRevenue: { $sum: '$orders.charge' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);

    // Get top users
    const topUsers = await User.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $project: {
          email: 1,
          firstName: 1,
          lastName: 1,
          balance: 1,
          orderCount: { $size: '$orders' },
          totalSpent: { $sum: '$orders.charge' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period,
        orderStats,
        transactionStats,
        serviceStats,
        topUsers
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update transaction status
const updateTransactionStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction.status = status;
    if (adminNotes) transaction.adminNotes = adminNotes;

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  getAllTransactions,
  getSystemStats,
  updateTransactionStatus
};

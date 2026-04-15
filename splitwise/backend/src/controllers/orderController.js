const Order = require('../models/Order');
const Service = require('../models/Service');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// Create new order
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { serviceId, targetLink, quantity, customComments, dripFeedSettings } = req.body;
    const userId = req.user.id;

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Validate quantity
    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      return res.status(400).json({
        success: false,
        message: `Quantity must be between ${service.minQuantity} and ${service.maxQuantity}`
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate charge
    const charge = service.price * quantity;

    // Check user balance
    if (user.balance < charge) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create order
    const order = new Order({
      user: userId,
      service: serviceId,
      serviceDetails: {
        name: service.name,
        category: service.category,
        price: service.price
      },
      targetLink,
      quantity,
      charge,
      customComments: customComments || [],
      dripFeedSettings: dripFeedSettings || {
        enabled: false,
        runs: 1,
        interval: 0,
        quantityPerRun: 0
      },
      apiProvider: service.apiProvider
    });

    await order.save();

    // Deduct balance and create transaction
    await Transaction.createTransaction({
      user: userId,
      type: 'spent',
      amount: charge,
      description: `Order: ${service.name} - ${quantity} units`,
      relatedOrder: order._id,
      metadata: { source: 'order_creation' }
    });

    // Update user statistics
    user.apiUsage.totalOrders += 1;
    user.apiUsage.totalSpent += charge;
    await user.save();

    // Update service statistics
    service.statistics.totalOrders += 1;
    service.statistics.totalQuantity += quantity;
    await service.save();

    // Start order processing (this would be handled by the order processor service)
    // For now, we'll set it to processing immediately
    order.status = 'processing';
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: await Order.findById(order._id).populate('service', 'name category')
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
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
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate('service', 'name category description')
      .populate('user', 'email firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
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
    const { status, currentCount, startCount, failureReason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order fields
    if (status) order.status = status;
    if (currentCount !== undefined) order.currentCount = currentCount;
    if (startCount !== undefined) order.startCount = startCount;
    if (failureReason) order.failureReason = failureReason;

    await order.save();

    // If order is completed or failed, handle refunds if necessary
    if (status === 'failed' && order.currentCount < order.quantity) {
      const refundAmount = ((order.quantity - order.currentCount) / order.quantity) * order.charge;
      
      await Transaction.createTransaction({
        user: order.user,
        type: 'refund',
        amount: refundAmount,
        description: `Refund for failed order: ${order.serviceDetails.name}`,
        relatedOrder: order._id,
        metadata: { source: 'order_failure' }
      });

      order.refundAmount = refundAmount;
      await order.save();
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: await Order.findById(id).populate('service', 'name category')
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;

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

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in current status'
      });
    }

    // Cancel order and process refund
    await order.cancel();

    // Full refund
    await Transaction.createTransaction({
      user: userId,
      type: 'refund',
      amount: order.charge,
      description: `Refund for cancelled order: ${order.serviceDetails.name}`,
      relatedOrder: order._id,
      metadata: { source: 'order_cancellation' }
    });

    order.refundAmount = order.charge;
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled and refund processed successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get order statistics
const getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {
      user: mongoose.Types.ObjectId(userId),
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    };

    const statistics = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSpent: { $sum: '$charge' },
          totalQuantity: { $sum: '$quantity' },
          avgOrderValue: { $avg: '$charge' }
        }
      }
    ]);

    // Get overall stats
    const overallStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$charge' },
          totalQuantity: { $sum: '$quantity' },
          avgOrderValue: { $avg: '$charge' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statistics,
        overallStats: overallStats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          totalQuantity: 0,
          avgOrderValue: 0
        }
      }
    });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
  getOrderStatistics
};

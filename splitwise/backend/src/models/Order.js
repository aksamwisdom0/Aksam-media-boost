const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required'],
    index: true
  },
  serviceDetails: {
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  targetLink: {
    type: String,
    required: [true, 'Target link is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v) ||
               /^@[\w.]+$/.test(v); // For social media usernames
      },
      message: 'Please enter a valid URL or username'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  startCount: {
    type: Number,
    default: 0,
    min: [0, 'Start count cannot be negative']
  },
  currentCount: {
    type: Number,
    default: 0,
    min: [0, 'Current count cannot be negative']
  },
  remainingCount: {
    type: Number,
    default: function() {
      return this.quantity;
    }
  },
  charge: {
    type: Number,
    required: [true, 'Charge is required'],
    min: [0, 'Charge cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'in_progress', 'completed', 'partial', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  apiOrderId: {
    type: String,
    trim: true,
    index: true
  },
  apiProvider: {
    type: String,
    trim: true
  },
  customComments: [{
    type: String,
    trim: true,
    maxlength: [200, 'Comment cannot exceed 200 characters']
  }],
  dripFeedSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    runs: {
      type: Number,
      default: 1
    },
    interval: {
      type: Number,
      default: 0 // minutes
    },
    quantityPerRun: {
      type: Number,
      default: 0
    }
  },
  refill: {
    enabled: {
      type: Boolean,
      default: false
    },
    lastRefillDate: {
      type: Date
    },
    refillCount: {
      type: Number,
      default: 0
    },
    maxRefills: {
      type: Number,
      default: 3
    }
  },
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  estimatedCompletion: {
    type: Date
  },
  actualCompletion: {
    type: Date
  },
  failureReason: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative']
  }
}, {
  timestamps: true
});

// Calculate remaining count
orderSchema.pre('save', function(next) {
  this.remainingCount = Math.max(0, this.quantity - this.currentCount);
  
  // Update progress percentage
  if (this.quantity > 0) {
    this.progress.percentage = Math.min(100, (this.currentCount / this.quantity) * 100);
  }
  
  this.progress.lastUpdated = new Date();
  next();
});

// Update status based on progress
orderSchema.methods.updateStatus = function() {
  if (this.currentCount >= this.quantity) {
    this.status = 'completed';
    this.actualCompletion = new Date();
  } else if (this.currentCount > 0 && this.currentCount < this.quantity) {
    this.status = 'partial';
  } else if (this.status === 'processing' && this.currentCount === 0) {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Add to current count
orderSchema.methods.addProgress = function(amount) {
  this.currentCount = Math.min(this.quantity, this.currentCount + amount);
  return this.updateStatus();
};

// Complete order
orderSchema.methods.complete = function() {
  this.currentCount = this.quantity;
  this.status = 'completed';
  this.actualCompletion = new Date();
  this.progress.percentage = 100;
  return this.save();
};

// Fail order
orderSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Cancel order
orderSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Process refund
orderSchema.methods.processRefund = function(amount) {
  this.refundAmount = amount;
  this.status = 'refunded';
  return this.save();
};

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ apiOrderId: 1 });
orderSchema.index({ service: 1 });

// Static method to get user orders
orderSchema.statics.getUserOrders = function(userId, page = 1, limit = 20, status = null) {
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('service', 'name category')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status, page = 1, limit = 20) {
  return this.find({ status })
    .populate('user', 'email firstName lastName')
    .populate('service', 'name category')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('Order', orderSchema);

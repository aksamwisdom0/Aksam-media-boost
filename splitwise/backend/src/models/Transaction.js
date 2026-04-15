const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'spent', 'refund', 'bonus', 'penalty'],
    required: [true, 'Transaction type is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  balanceBefore: {
    type: Number,
    required: [true, 'Balance before is required'],
    min: [0, 'Balance before cannot be negative']
  },
  balanceAfter: {
    type: Number,
    required: [true, 'Balance after is required'],
    min: [0, 'Balance after cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  reference: {
    type: String,
    trim: true,
    index: true
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  paymentMethod: {
    type: String,
    enum: ['paypal', 'stripe', 'crypto', 'bank_transfer', 'credit_card', 'debit_card', 'wallet', 'admin_adjustment'],
    required: function() {
      return this.type === 'deposit' || this.type === 'withdraw';
    }
  },
  paymentDetails: {
    transactionId: {
      type: String,
      trim: true
    },
    gateway: {
      type: String,
      trim: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    exchangeRate: {
      type: Number,
      default: 1
    },
    fee: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
    index: true
  },
  metadata: {
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    source: {
      type: String,
      enum: ['web', 'api', 'admin', 'system'],
      default: 'web'
    }
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  isReversible: {
    type: Boolean,
    default: true
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  reversalReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Validate balance consistency
transactionSchema.pre('save', function(next) {
  // For deposits and bonuses: balanceAfter = balanceBefore + amount
  if (['deposit', 'bonus'].includes(this.type)) {
    if (Math.abs((this.balanceBefore + this.amount) - this.balanceAfter) > 0.01) {
      return next(new Error('Balance after calculation is incorrect for deposit/bonus'));
    }
  }
  
  // For spent, withdrawals, penalties: balanceAfter = balanceBefore - amount
  if (['spent', 'withdraw', 'penalty'].includes(this.type)) {
    if (Math.abs((this.balanceBefore - this.amount) - this.balanceAfter) > 0.01) {
      return next(new Error('Balance after calculation is incorrect for spent/withdraw/penalty'));
    }
  }
  
  // For refunds: balanceAfter = balanceBefore + amount
  if (this.type === 'refund') {
    if (Math.abs((this.balanceBefore + this.amount) - this.balanceAfter) > 0.01) {
      return next(new Error('Balance after calculation is incorrect for refund'));
    }
  }
  
  next();
});

// Static method to create transaction
transactionSchema.statics.createTransaction = async function(data) {
  const user = await mongoose.model('User').findById(data.user);
  if (!user) {
    throw new Error('User not found');
  }
  
  const balanceBefore = user.balance;
  let balanceAfter = balanceBefore;
  
  // Calculate balance after based on transaction type
  switch (data.type) {
    case 'deposit':
    case 'bonus':
    case 'refund':
      balanceAfter = balanceBefore + data.amount;
      break;
    case 'spent':
    case 'withdraw':
    case 'penalty':
      if (balanceBefore < data.amount) {
        throw new Error('Insufficient balance');
      }
      balanceAfter = balanceBefore - data.amount;
      break;
  }
  
  // Update user balance
  user.balance = balanceAfter;
  await user.save();
  
  // Create transaction record
  const transaction = new this({
    ...data,
    balanceBefore,
    balanceAfter
  });
  
  return transaction.save();
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, page = 1, limit = 20, type = null) {
  const query = { user: userId };
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get transaction statistics
transactionSchema.statics.getStatistics = function(userId, startDate = null, endDate = null) {
  const matchStage = { user: mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Indexes for better performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

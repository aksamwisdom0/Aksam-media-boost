const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Instagram Followers',
      'Instagram Likes',
      'Instagram Comments',
      'Instagram Views',
      'Facebook Followers',
      'Facebook Likes',
      'Facebook Comments',
      'Facebook Shares',
      'Twitter Followers',
      'Twitter Likes',
      'Twitter Retweets',
      'YouTube Subscribers',
      'YouTube Views',
      'YouTube Likes',
      'TikTok Followers',
      'TikTok Likes',
      'TikTok Views',
      'LinkedIn Followers',
      'LinkedIn Connections',
      'Spotify Followers',
      'Spotify Plays',
      'SoundCloud Plays',
      'Telegram Members',
      'Website Traffic',
      'SEO Services'
    ],
    index: true
  },
  serviceId: {
    type: String,
    required: [true, 'Service ID is required'],
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0']
  },
  minQuantity: {
    type: Number,
    required: [true, 'Minimum quantity is required'],
    min: [1, 'Minimum quantity must be at least 1']
  },
  maxQuantity: {
    type: Number,
    required: [true, 'Maximum quantity is required'],
    min: [1, 'Maximum quantity must be at least 1']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  dripFeed: {
    type: Boolean,
    default: false
  },
  refill: {
    type: Boolean,
    default: false
  },
  refillGuarantee: {
    type: Number,
    default: 30, // days
    min: [0, 'Refill guarantee cannot be negative']
  },
  averageTime: {
    type: String,
    trim: true,
    default: 'Instant'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  apiProvider: {
    type: String,
    trim: true
  },
  quality: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Premium'],
    default: 'Medium'
  },
  speed: {
    type: String,
    enum: ['Slow', 'Normal', 'Fast', 'Instant'],
    default: 'Normal'
  },
  targetRequirements: {
    username: {
      type: Boolean,
      default: false
    },
    postLink: {
      type: Boolean,
      default: false
    },
    customComments: {
      type: Boolean,
      default: false
    }
  },
  statistics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 100
    },
    averageCompletionTime: {
      type: Number, // in hours
      default: 0
    }
  }
}, {
  timestamps: true
});

// Validation for min/max quantity
serviceSchema.pre('save', function(next) {
  if (this.minQuantity > this.maxQuantity) {
    return next(new Error('Minimum quantity cannot be greater than maximum quantity'));
  }
  next();
});

// Indexes for better performance
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ isPopular: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ serviceId: 1 });

// Virtual for price per unit
serviceSchema.virtual('pricePerUnit').get(function() {
  return this.price;
});

// Static method to get services by category
serviceSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ isPopular: -1, price: 1 });
};

// Static method to get popular services
serviceSchema.statics.getPopular = function() {
  return this.find({ isActive: true, isPopular: true }).sort({ statistics: -1 });
};

module.exports = mongoose.model('Service', serviceSchema);

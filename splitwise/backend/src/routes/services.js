const express = require('express');
const { body, query } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// Validation rules
const createServiceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ max: 100 })
    .withMessage('Service name cannot exceed 100 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
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
    ])
    .withMessage('Invalid category'),
  body('serviceId')
    .trim()
    .notEmpty()
    .withMessage('Service ID is required'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),
  body('minQuantity')
    .isInt({ min: 1 })
    .withMessage('Minimum quantity must be at least 1'),
  body('maxQuantity')
    .isInt({ min: 1 })
    .withMessage('Maximum quantity must be at least 1'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const updateServiceValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Service name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Service name cannot exceed 100 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),
  body('minQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum quantity must be at least 1'),
  body('maxQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum quantity must be at least 1')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Public routes
router.get('/', paginationValidation, serviceController.getAllServices);
router.get('/search', paginationValidation, serviceController.searchServices);
router.get('/popular', serviceController.getPopularServices);
router.get('/categories', serviceController.getCategories);
router.get('/category/:category', paginationValidation, serviceController.getServicesByCategory);
router.get('/:id', serviceController.getService);

// Admin routes
router.post('/', auth, admin, createServiceValidation, serviceController.createService);
router.put('/:id', auth, admin, updateServiceValidation, serviceController.updateService);
router.delete('/:id', auth, admin, serviceController.deleteService);

module.exports = router;

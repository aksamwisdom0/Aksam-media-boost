const express = require('express');
const { body, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('serviceId')
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('targetLink')
    .trim()
    .notEmpty()
    .withMessage('Target link is required')
    .matches(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$|^@[\w.]+$/)
    .withMessage('Please enter a valid URL or username'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('customComments')
    .optional()
    .isArray()
    .withMessage('Custom comments must be an array'),
  body('customComments.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Each comment cannot exceed 200 characters'),
  body('dripFeedSettings')
    .optional()
    .isObject()
    .withMessage('Drip feed settings must be an object'),
  body('dripFeedSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Drip feed enabled must be boolean'),
  body('dripFeedSettings.runs')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Drip feed runs must be at least 1'),
  body('dripFeedSettings.interval')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Drip feed interval must be at least 0'),
  body('dripFeedSettings.quantityPerRun')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Drip feed quantity per run must be at least 0')
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'processing', 'in_progress', 'completed', 'partial', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  body('currentCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current count must be at least 0'),
  body('startCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Start count must be at least 0'),
  body('failureReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Failure reason cannot exceed 500 characters')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'in_progress', 'completed', 'partial', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status')
];

// User routes
router.post('/', auth, createOrderValidation, orderController.createOrder);
router.get('/', auth, paginationValidation, orderController.getUserOrders);
router.get('/statistics', auth, orderController.getOrderStatistics);
router.get('/:id', auth, orderController.getOrder);
router.put('/:id/cancel', auth, orderController.cancelOrder);

// Admin routes
router.get('/all', auth, admin, paginationValidation, orderController.getAllOrders);
router.put('/:id/status', auth, admin, updateOrderStatusValidation, orderController.updateOrderStatus);

module.exports = router;

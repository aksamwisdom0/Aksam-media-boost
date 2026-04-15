const express = require('express');
const { body, query } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// Validation rules
const updateBalanceValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .isIn(['deposit', 'withdraw', 'bonus', 'penalty'])
    .withMessage('Type must be deposit, withdraw, bonus, or penalty'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];

const addFundsValidation = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('paymentMethod')
    .isIn(['paypal', 'stripe', 'crypto', 'bank_transfer', 'credit_card', 'debit_card'])
    .withMessage('Valid payment method is required'),
  body('paymentDetails')
    .isObject()
    .withMessage('Payment details are required')
];

const withdrawFundsValidation = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('paymentMethod')
    .isIn(['paypal', 'stripe', 'crypto', 'bank_transfer'])
    .withMessage('Valid payment method is required'),
  body('paymentDetails')
    .isObject()
    .withMessage('Payment details are required')
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

// User routes
router.get('/profile', auth, userController.getProfile);
router.get('/orders', auth, paginationValidation, userController.getOrderHistory);
router.get('/transactions', auth, paginationValidation, userController.getTransactions);
router.get('/statistics', auth, userController.getStatistics);
router.post('/add-funds', auth, addFundsValidation, userController.addFunds);
router.post('/withdraw-funds', auth, withdrawFundsValidation, userController.withdrawFunds);

// Admin routes
router.put('/balance', auth, admin, updateBalanceValidation, userController.updateBalance);

module.exports = router;

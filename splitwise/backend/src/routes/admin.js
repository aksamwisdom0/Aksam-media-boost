const express = require('express');
const { body, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// Validation rules
const updateUserStatusValidation = [
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be user or admin')
];

const updateTransactionStatusValidation = [
  body('status')
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters')
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

// Dashboard routes
router.get('/dashboard', auth, admin, adminController.getDashboardStats);
router.get('/stats', auth, admin, adminController.getSystemStats);

// User management routes
router.get('/users', auth, admin, paginationValidation, adminController.getAllUsers);
router.put('/users/:id', auth, admin, updateUserStatusValidation, adminController.updateUserStatus);

// Order management routes
router.get('/orders', auth, admin, paginationValidation, adminController.getAllOrders);

// Transaction management routes
router.get('/transactions', auth, admin, paginationValidation, adminController.getAllTransactions);
router.put('/transactions/:id', auth, admin, updateTransactionStatusValidation, adminController.updateTransactionStatus);

module.exports = router;

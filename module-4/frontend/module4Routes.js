const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const module4Controller = require('../controllers/module4Controller');

// ============ PAYMENT ROUTES ============
router.post('/create-order', authMiddleware, module4Controller.createPaymentOrder);
router.post('/verify-payment', authMiddleware, module4Controller.verifyPayment);
router.get('/payment-history', authMiddleware, module4Controller.getPaymentHistory);

// ============ ADMIN ROUTES ============
router.post('/admin/login', module4Controller.adminLogin);
router.get('/admin/users', authMiddleware, adminMiddleware, module4Controller.getAllUsers);
router.get('/admin/mechanics', authMiddleware, adminMiddleware, module4Controller.getAllMechanics);
router.get('/admin/requests', authMiddleware, adminMiddleware, module4Controller.getAllServiceRequests);
router.get('/admin/payments', authMiddleware, adminMiddleware, module4Controller.getAllPayments);
router.get('/admin/stats', authMiddleware, adminMiddleware, module4Controller.getDashboardStats);

module.exports = router;

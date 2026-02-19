const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const module1Controller = require('../controllers/module1Controller');

// User Registration & Login
router.post('/register', module1Controller.registerUser);
router.post('/login', module1Controller.loginUser);

// Service Request with Location
router.post('/service-request', authMiddleware, module1Controller.createServiceRequest);
router.get('/my-requests', authMiddleware, module1Controller.getUserRequests);

module.exports = router;

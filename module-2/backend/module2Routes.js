const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const module2Controller = require('../controllers/module2Controller');

// Mechanic Registration & Login
router.post('/register', module2Controller.registerMechanic);
router.post('/login', module2Controller.loginMechanic);

// Mechanic Service Request Management
router.get('/pending-requests', authMiddleware, module2Controller.getPendingRequests);
router.put('/accept/:requestId', authMiddleware, module2Controller.acceptRequest);
router.put('/reject/:requestId', authMiddleware, module2Controller.rejectRequest);
router.get('/my-jobs', authMiddleware, module2Controller.getMechanicRequests);

module.exports = router;

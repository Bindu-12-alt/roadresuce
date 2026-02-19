const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Payment = require('../models/Payment');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ============ PAYMENT FEATURES ============

// Create Razorpay Order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { serviceRequestId, amount } = req.body;
    
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${serviceRequestId}`
    };

    const order = await razorpay.orders.create(options);
    
    const payment = new Payment({
      serviceRequestId,
      userId: req.user.id,
      amount,
      razorpayOrderId: order.id,
      status: 'Pending'
    });
    await payment.save();

    res.json({ order, paymentId: payment._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    
    const sign = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpaySignature === expectedSign) {
      const payment = await Payment.findById(paymentId);
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.status = 'Success';
      await payment.save();

      const serviceRequest = await ServiceRequest.findById(payment.serviceRequestId);
      serviceRequest.paymentId = payment._id;
      serviceRequest.status = 'Completed';
      serviceRequest.updatedAt = Date.now();
      await serviceRequest.save();

      res.json({ message: 'Payment verified successfully', payment });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Payment History
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('serviceRequestId')
      .sort({ createdAt: -1 });
    
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ ADMIN FEATURES ============

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admins = [
      { email: 'bindu@roadrescue.com', password: 'bindu@123' },
      { email: 'surya@roadrescue.com', password: 'surya@789' }
    ];
    
    const admin = admins.find(a => a.email === email && a.password === password);
    
    if (admin) {
      const token = jwt.sign({ id: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ message: 'Admin login successful', token, role: 'admin' });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Mechanics
exports.getAllMechanics = async (req, res) => {
  try {
    const mechanics = await User.find({ role: 'mechanic' }).select('-password');
    res.json({ mechanics });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Service Requests
exports.getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate('userId', 'name email phone')
      .populate('mechanicId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate('serviceRequestId')
      .sort({ createdAt: -1 });
    
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMechanics = await User.countDocuments({ role: 'mechanic' });
    const totalRequests = await ServiceRequest.countDocuments();
    const pendingRequests = await ServiceRequest.countDocuments({ status: 'Pending' });
    const completedRequests = await ServiceRequest.countDocuments({ status: 'Completed' });
    const totalPayments = await Payment.countDocuments({ status: 'Success' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'Success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalUsers,
      totalMechanics,
      totalRequests,
      pendingRequests,
      completedRequests,
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

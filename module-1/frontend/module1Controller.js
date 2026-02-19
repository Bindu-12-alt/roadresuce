const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const jwt = require('jsonwebtoken');

// User Registration
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, phone, role: 'user' });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create Service Request with Location
exports.createServiceRequest = async (req, res) => {
  try {
    const { problemType, description, location } = req.body;
    
    const serviceRequest = new ServiceRequest({
      userId: req.user.id,
      problemType,
      description,
      location
    });

    await serviceRequest.save();
    
    res.status(201).json({ 
      message: 'Service request created successfully',
      serviceRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get User's Service Requests
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ userId: req.user.id })
      .populate('mechanicId', 'name phone')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

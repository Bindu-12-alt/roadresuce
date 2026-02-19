const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const jwt = require('jsonwebtoken');

// Mechanic Registration
exports.registerMechanic = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Mechanic already exists' });
    }

    const mechanic = new User({ name, email, password, phone, role: 'mechanic' });
    await mechanic.save();

    const token = jwt.sign({ id: mechanic._id, role: mechanic.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      message: 'Mechanic registered successfully',
      token,
      mechanic: { id: mechanic._id, name: mechanic.name, email: mechanic.email, role: mechanic.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mechanic Login
exports.loginMechanic = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const mechanic = await User.findOne({ email, role: 'mechanic' });
    if (!mechanic || !(await mechanic.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: mechanic._id, role: mechanic.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      message: 'Login successful',
      token,
      mechanic: { id: mechanic._id, name: mechanic.name, email: mechanic.email, role: mechanic.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Pending Service Requests
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ status: 'Pending' })
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Accept Service Request
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request already accepted by another mechanic' });
    }

    request.mechanicId = req.user.id;
    request.status = 'Accepted';
    request.updatedAt = Date.now();
    await request.save();

    res.json({ message: 'Request accepted successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject Service Request
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Mechanic's Accepted Requests
exports.getMechanicRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ mechanicId: req.user.id })
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

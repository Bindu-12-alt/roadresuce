const ServiceRequest = require('../models/ServiceRequest');

// Get Service Request Status
exports.getRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await ServiceRequest.findById(requestId)
      .populate('userId', 'name phone email')
      .populate('mechanicId', 'name phone email');
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Service Request Status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    request.status = status;
    request.updatedAt = Date.now();
    await request.save();

    res.json({ message: 'Status updated successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Service History
exports.getServiceHistory = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ userId: req.user.id, status: 'Completed' })
      .populate('mechanicId', 'name phone')
      .sort({ updatedAt: -1 });
    
    res.json({ history: requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Requests (for tracking dashboard)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate('userId', 'name phone email')
      .populate('mechanicId', 'name phone email')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

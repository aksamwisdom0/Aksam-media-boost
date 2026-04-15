const Service = require('../models/Service');
const { validationResult } = require('express-validator');

// Get all services
const getAllServices = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, sortBy = 'price', sortOrder = 'asc' } = req.query;
    
    // Build query
    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const services = await Service.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalServices = await Service.countDocuments(query);

    // Get unique categories
    const categories = await Service.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: {
        services,
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalServices / parseInt(limit)),
          totalServices,
          hasNext: parseInt(page) < Math.ceil(totalServices / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single service
const getService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({ _id: id, isActive: true });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: {
        service
      }
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get services by category
const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50, sortBy = 'price', sortOrder = 'asc' } = req.query;

    const services = await Service.getByCategory(category)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalServices = await Service.countDocuments({ category, isActive: true });

    res.json({
      success: true,
      data: {
        services,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalServices / parseInt(limit)),
          totalServices,
          hasNext: parseInt(page) < Math.ceil(totalServices / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get popular services
const getPopularServices = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const services = await Service.getPopular()
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        services
      }
    });
  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category', { isActive: true });

    // Get service count per category
    const categoryStats = await Service.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        categories,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new service (admin only)
const createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const serviceData = req.body;
    
    // Check if service ID already exists
    const existingService = await Service.findOne({ serviceId: serviceData.serviceId });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service ID already exists'
      });
    }

    const service = new Service(serviceData);
    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        service
      }
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Update service (admin only)
const updateService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const service = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        service
      }
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Delete service (admin only)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search services
const searchServices = async (req, res) => {
  try {
    const { q, page = 1, limit = 50, category } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    const query = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    };

    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .sort({ isPopular: -1, name: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalServices = await Service.countDocuments(query);

    res.json({
      success: true,
      data: {
        services,
        query: q,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalServices / parseInt(limit)),
          totalServices,
          hasNext: parseInt(page) < Math.ceil(totalServices / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllServices,
  getService,
  getServicesByCategory,
  getPopularServices,
  getCategories,
  createService,
  updateService,
  deleteService,
  searchServices
};

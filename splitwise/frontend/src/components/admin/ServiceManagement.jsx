import React, { useState, useEffect } from 'react';
import { useServices } from '../../hooks/useServices';
import Loading from '../common/Loading';

const ServiceManagement = () => {
  const { getAllServices, createService, updateService, deleteService } = useServices();
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serviceId: '',
    price: '',
    minQuantity: '',
    maxQuantity: '',
    description: '',
    dripFeed: false,
    refill: false,
    refillGuarantee: 30,
    averageTime: 'Instant',
    isActive: true,
    isPopular: false,
    apiProvider: '',
    quality: 'Medium',
    speed: 'Normal'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await getAllServices({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
        setServices(data.services);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [getAllServices]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.serviceId.trim()) {
      newErrors.serviceId = 'Service ID is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.minQuantity || formData.minQuantity < 1) {
      newErrors.minQuantity = 'Minimum quantity must be at least 1';
    }

    if (!formData.maxQuantity || formData.maxQuantity < 1) {
      newErrors.maxQuantity = 'Maximum quantity must be at least 1';
    }

    if (formData.minQuantity && formData.maxQuantity && parseInt(formData.minQuantity) > parseInt(formData.maxQuantity)) {
      newErrors.maxQuantity = 'Maximum quantity must be greater than minimum quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createService({
        ...formData,
        price: parseFloat(formData.price),
        minQuantity: parseInt(formData.minQuantity),
        maxQuantity: parseInt(formData.maxQuantity),
        refillGuarantee: parseInt(formData.refillGuarantee)
      });
      setShowAddModal(false);
      resetForm();
      // Refresh services
      const data = await getAllServices({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      setServices(data.services);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create service' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await updateService(selectedService._id, {
        ...formData,
        price: parseFloat(formData.price),
        minQuantity: parseInt(formData.minQuantity),
        maxQuantity: parseInt(formData.maxQuantity),
        refillGuarantee: parseInt(formData.refillGuarantee)
      });
      setShowEditModal(false);
      setSelectedService(null);
      resetForm();
      // Refresh services
      const data = await getAllServices({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      setServices(data.services);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to update service' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service? This will deactivate it.')) {
      return;
    }

    try {
      await deleteService(serviceId);
      // Refresh services
      const data = await getAllServices({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      setServices(data.services);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleEditClick = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      category: service.category,
      serviceId: service.serviceId,
      price: service.price,
      minQuantity: service.minQuantity,
      maxQuantity: service.maxQuantity,
      description: service.description || '',
      dripFeed: service.dripFeed,
      refill: service.refill,
      refillGuarantee: service.refillGuarantee,
      averageTime: service.averageTime,
      isActive: service.isActive,
      isPopular: service.isPopular,
      apiProvider: service.apiProvider || '',
      quality: service.quality,
      speed: service.speed
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      serviceId: '',
      price: '',
      minQuantity: '',
      maxQuantity: '',
      description: '',
      dripFeed: false,
      refill: false,
      refillGuarantee: 30,
      averageTime: 'Instant',
      isActive: true,
      isPopular: false,
      apiProvider: '',
      quality: 'Medium',
      speed: 'Normal'
    });
    setErrors({});
  };

  const categories = [
    'Instagram Followers',
    'Instagram Likes',
    'Instagram Comments',
    'Instagram Views',
    'Facebook Followers',
    'Facebook Likes',
    'Facebook Comments',
    'Facebook Shares',
    'Twitter Followers',
    'Twitter Likes',
    'Twitter Retweets',
    'YouTube Subscribers',
    'YouTube Views',
    'YouTube Likes',
    'TikTok Followers',
    'TikTok Likes',
    'TikTok Views',
    'LinkedIn Followers',
    'LinkedIn Connections',
    'Spotify Followers',
    'Spotify Plays',
    'SoundCloud Plays',
    'Telegram Members',
    'Website Traffic',
    'SEO Services'
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Service Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Service
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {service.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {service.serviceId}
                      </div>
                      {service.isPopular && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mt-1">
                          Popular
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{service.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${service.price}
                    </div>
                    <div className="text-sm text-gray-500">per unit</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {service.minQuantity} - {service.maxQuantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {service.dripFeed && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Drip Feed
                        </span>
                      )}
                      {service.refill && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Refill ({service.refillGuarantee}d)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {service.statistics?.totalOrders || 0} orders
                    </div>
                    <div className="text-sm text-gray-500">
                      {service.statistics?.successRate || 100}% success
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(service)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Service</h3>
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleAddService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Instagram Followers"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service ID *
                  </label>
                  <input
                    type="text"
                    value={formData.serviceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.serviceId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., ig_followers_1"
                  />
                  {errors.serviceId && (
                    <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Unit ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    step="0.01"
                    min="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.01"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.minQuantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="100"
                  />
                  {errors.minQuantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.minQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: e.target.value }))}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maxQuantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10000"
                  />
                  {errors.maxQuantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxQuantity}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Service description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Time
                  </label>
                  <input
                    type="text"
                    value={formData.averageTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, averageTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Instant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select
                    value={formData.quality}
                    onChange={(e) => setFormData(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speed
                  </label>
                  <select
                    value={formData.speed}
                    onChange={(e) => setFormData(prev => ({ ...prev, speed: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Slow">Slow</option>
                    <option value="Normal">Normal</option>
                    <option value="Fast">Fast</option>
                    <option value="Instant">Instant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Provider
                  </label>
                  <input
                    type="text"
                    value={formData.apiProvider}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiProvider: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provider name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refill Guarantee (days)
                  </label>
                  <input
                    type="number"
                    value={formData.refillGuarantee}
                    onChange={(e) => setFormData(prev => ({ ...prev, refillGuarantee: e.target.value }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dripFeed}
                    onChange={(e) => setFormData(prev => ({ ...prev, dripFeed: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Enable Drip Feed
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.refill}
                    onChange={(e) => setFormData(prev => ({ ...prev, refill: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Enable Refill
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Mark as Popular
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal - Same as Add Modal but with update functionality */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Service</h3>
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleEditService} className="space-y-4">
              {/* Same form fields as Add Modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Unit ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    step="0.01"
                    min="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.minQuantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.minQuantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.minQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: e.target.value }))}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maxQuantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.maxQuantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxQuantity}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedService(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Updating...' : 'Update Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;

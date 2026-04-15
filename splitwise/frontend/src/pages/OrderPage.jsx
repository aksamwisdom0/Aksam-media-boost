import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import { useOrders } from '../hooks/useOrders';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';

const OrderPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getService } = useServices();
  const { createOrder } = useOrders();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [orderData, setOrderData] = useState({
    targetLink: '',
    quantity: '',
    customComments: [],
    dripFeedSettings: {
      enabled: false,
      runs: 1,
      interval: 0,
      quantityPerRun: 0
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchService = async () => {
      try {
        const data = await getService(serviceId);
        setService(data.service);
        // Set default quantity to minimum
        setOrderData(prev => ({ ...prev, quantity: data.service.minQuantity }));
      } catch (error) {
        console.error('Error fetching service:', error);
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, getService, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!orderData.targetLink.trim()) {
      newErrors.targetLink = 'Target link is required';
    } else if (!isValidUrl(orderData.targetLink) && !isValidUsername(orderData.targetLink)) {
      newErrors.targetLink = 'Please enter a valid URL or username';
    }

    if (!orderData.quantity || orderData.quantity < service.minQuantity) {
      newErrors.quantity = `Minimum quantity is ${service.minQuantity}`;
    } else if (orderData.quantity > service.maxQuantity) {
      newErrors.quantity = `Maximum quantity is ${service.maxQuantity}`;
    }

    if (orderData.dripFeedSettings.enabled) {
      if (!orderData.dripFeedSettings.runs || orderData.dripFeedSettings.runs < 1) {
        newErrors.runs = 'Number of runs must be at least 1';
      }
      if (!orderData.dripFeedSettings.quantityPerRun || orderData.dripFeedSettings.quantityPerRun < 1) {
        newErrors.quantityPerRun = 'Quantity per run must be at least 1';
      }
      if (orderData.dripFeedSettings.runs * orderData.dripFeedSettings.quantityPerRun !== parseInt(orderData.quantity)) {
        newErrors.dripFeed = 'Total quantity (runs × quantity per run) must match the order quantity';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const isValidUsername = (string) => {
    return /^@[\w.]+$/.test(string);
  };

  const calculateCharge = () => {
    if (!service || !orderData.quantity) return 0;
    return (service.price * orderData.quantity).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (user.balance < parseFloat(calculateCharge())) {
      setErrors({ balance: 'Insufficient balance. Please add funds to your account.' });
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        serviceId: service._id,
        ...orderData,
        quantity: parseInt(orderData.quantity)
      });
      
      setOrderData(order);
      setShowModal(true);
    } catch (error) {
      console.error('Error creating order:', error);
      setErrors({ submit: error.message || 'Failed to create order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDripFeedChange = (field, value) => {
    setOrderData(prev => ({
      ...prev,
      dripFeedSettings: {
        ...prev.dripFeedSettings,
        [field]: value
      }
    }));
    if (errors[field] || errors.dripFeed) {
      setErrors(prev => ({ ...prev, [field]: '', dripFeed: '' }));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/dashboard');
  };

  if (loading) {
    return <Loading />;
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-8">The service you're looking for doesn't exist or is no longer available.</p>
          <button
            onClick={() => navigate('/services')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Service Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h1>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-gray-500">
                <span className="font-medium">Category:</span> {service.category}
              </span>
              <span className="text-gray-500">
                <span className="font-medium">Price:</span> ${service.price} per unit
              </span>
              <span className="text-gray-500">
                <span className="font-medium">Quantity:</span> {service.minQuantity} - {service.maxQuantity}
              </span>
              <span className="text-gray-500">
                <span className="font-medium">Average Time:</span> {service.averageTime}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">${service.price}</div>
            <div className="text-sm text-gray-500">per unit</div>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Place Your Order</h2>
        
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {errors.balance && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">{errors.balance}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-2 text-blue-600 hover:text-blue-700 underline"
            >
              Add Funds to Your Account
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Link / Username *
            </label>
            <input
              type="text"
              value={orderData.targetLink}
              onChange={(e) => handleInputChange('targetLink', e.target.value)}
              placeholder="https://instagram.com/username or @username"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.targetLink ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.targetLink && (
              <p className="mt-1 text-sm text-red-600">{errors.targetLink}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity * ({service.minQuantity} - {service.maxQuantity})
            </label>
            <input
              type="number"
              value={orderData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              min={service.minQuantity}
              max={service.maxQuantity}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Custom Comments (if applicable) */}
          {service.targetRequirements?.customComments && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Comments (Optional)
              </label>
              <textarea
                value={orderData.customComments.join('\n')}
                onChange={(e) => handleInputChange('customComments', e.target.value.split('\n').filter(c => c.trim()))}
                placeholder="Enter comments, one per line"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Drip Feed Settings (if applicable) */}
          {service.dripFeed && (
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="dripFeed"
                  checked={orderData.dripFeedSettings.enabled}
                  onChange={(e) => handleDripFeedChange('enabled', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="dripFeed" className="text-sm font-medium text-gray-700">
                  Enable Drip Feed
                </label>
              </div>

              {orderData.dripFeedSettings.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Runs
                    </label>
                    <input
                      type="number"
                      value={orderData.dripFeedSettings.runs}
                      onChange={(e) => handleDripFeedChange('runs', parseInt(e.target.value))}
                      min="1"
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.runs ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.runs && (
                      <p className="mt-1 text-sm text-red-600">{errors.runs}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interval (minutes)
                    </label>
                    <input
                      type="number"
                      value={orderData.dripFeedSettings.interval}
                      onChange={(e) => handleDripFeedChange('interval', parseInt(e.target.value))}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity per Run
                    </label>
                    <input
                      type="number"
                      value={orderData.dripFeedSettings.quantityPerRun}
                      onChange={(e) => handleDripFeedChange('quantityPerRun', parseInt(e.target.value))}
                      min="1"
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.quantityPerRun ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.quantityPerRun && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantityPerRun}</p>
                    )}
                  </div>
                </div>
              )}

              {errors.dripFeed && (
                <p className="mt-2 text-sm text-red-600">{errors.dripFeed}</p>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{orderData.quantity || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per unit:</span>
                  <span className="font-medium">${service.price}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Charge:</span>
                  <span className="text-blue-600">${calculateCharge()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title="Order Placed Successfully!"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Created Successfully</h3>
          <p className="text-gray-600 mb-4">
            Your order has been placed and is now being processed. Order ID: {orderData._id}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleModalClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/services')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Browse More Services
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderPage;

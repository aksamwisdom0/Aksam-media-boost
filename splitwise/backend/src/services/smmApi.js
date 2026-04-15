const axios = require('axios');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class SMMAPIService {
  constructor() {
    this.apiKey = process.env.SMM_API_KEY;
    this.apiUrl = process.env.SMM_API_URL;
    this.timeout = 30000; // 30 seconds timeout
  }

  // Create axios instance with default configuration
  createApiClient() {
    return axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }

  // Place order to external SMM API
  async placeOrder(order) {
    try {
      const client = this.createApiClient();
      
      const payload = {
        service: order.serviceDetails.serviceId || order.service.serviceId,
        link: order.targetLink,
        quantity: order.quantity,
        custom_comments: order.customComments,
        runs: order.dripFeedSettings?.enabled ? order.dripFeedSettings.runs : undefined,
        interval: order.dripFeedSettings?.enabled ? order.dripFeedSettings.interval : undefined
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const response = await client.post('/order', payload);
      
      if (response.data && response.data.order) {
        // Update order with API order ID
        order.apiOrderId = response.data.order.toString();
        order.apiProvider = this.apiUrl;
        order.status = 'processing';
        await order.save();

        return {
          success: true,
          apiOrderId: response.data.order,
          message: 'Order placed successfully'
        };
      } else {
        throw new Error('Invalid response from SMM API');
      }
    } catch (error) {
      console.error('Error placing order to SMM API:', error.response?.data || error.message);
      
      // Update order status to failed
      order.status = 'failed';
      order.failureReason = error.response?.data?.message || error.message || 'API request failed';
      await order.save();

      // Process refund
      await this.processRefund(order);

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Check order status from external SMM API
  async checkOrderStatus(order) {
    try {
      if (!order.apiOrderId) {
        console.warn(`Order ${order._id} has no API order ID`);
        return null;
      }

      const client = this.createApiClient();
      const response = await client.get(`/order/${order.apiOrderId}`);

      if (response.data && response.data.order) {
        const apiOrder = response.data.order;
        return {
          status: apiOrder.status,
          start_count: apiOrder.start_count,
          current_count: apiOrder.current_count,
          remains: apiOrder.remains,
          charge: apiOrder.charge
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking order status for ${order.apiOrderId}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Update order status based on API response
  async updateOrderStatus(order, apiStatus) {
    try {
      const oldStatus = order.status;
      let needsUpdate = false;

      // Map API status to our status
      const statusMap = {
        'pending': 'pending',
        'processing': 'processing',
        'in_progress': 'in_progress',
        'partial': 'partial',
        'completed': 'completed',
        'failed': 'failed',
        'cancelled': 'cancelled'
      };

      const newStatus = statusMap[apiStatus.status];
      if (newStatus && newStatus !== order.status) {
        order.status = newStatus;
        needsUpdate = true;
      }

      // Update counts if provided
      if (apiStatus.start_count !== undefined && apiStatus.start_count !== order.startCount) {
        order.startCount = apiStatus.start_count;
        needsUpdate = true;
      }

      if (apiStatus.current_count !== undefined && apiStatus.current_count !== order.currentCount) {
        order.currentCount = apiStatus.current_count;
        needsUpdate = true;
      }

      // Handle partial orders
      if (newStatus === 'partial' && apiStatus.remains !== undefined) {
        order.remainingCount = apiStatus.remains;
        needsUpdate = true;
      }

      // Handle completed orders
      if (newStatus === 'completed') {
        order.currentCount = order.quantity;
        order.remainingCount = 0;
        order.actualCompletion = new Date();
        needsUpdate = true;

        // Update service statistics
        await this.updateServiceStats(order.service, true);
      }

      // Handle failed orders
      if (newStatus === 'failed' && oldStatus !== 'failed') {
        order.failureReason = 'Order failed at API provider';
        needsUpdate = true;

        // Process refund for failed orders
        await this.processRefund(order);

        // Update service statistics
        await this.updateServiceStats(order.service, false);
      }

      if (needsUpdate) {
        await order.save();
        console.log(`Updated order ${order._id} status to ${order.status}`);
      }

      return needsUpdate;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Process refund for failed/partial orders
  async processRefund(order) {
    try {
      if (order.currentCount >= order.quantity) {
        return; // No refund needed for completed orders
      }

      const undeliveredQuantity = order.quantity - order.currentCount;
      const refundAmount = (undeliveredQuantity / order.quantity) * order.charge;

      if (refundAmount > 0) {
        // Create refund transaction
        await Transaction.createTransaction({
          user: order.user,
          type: 'refund',
          amount: refundAmount,
          description: `Refund for failed/partial order: ${order.serviceDetails.name}`,
          relatedOrder: order._id,
          metadata: { source: 'order_failure' }
        });

        // Update order refund amount
        order.refundAmount = refundAmount;
        await order.save();

        console.log(`Processed refund of $${refundAmount} for order ${order._id}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  }

  // Update service statistics
  async updateServiceStats(serviceId, success) {
    try {
      const service = await Service.findById(serviceId);
      if (!service) return;

      if (success) {
        service.statistics.successRate = Math.max(
          0,
          Math.min(100, service.statistics.successRate + 0.1)
        );
      } else {
        service.statistics.successRate = Math.max(
          0,
          service.statistics.successRate - 0.5
        );
      }

      await service.save();
    } catch (error) {
      console.error('Error updating service statistics:', error);
    }
  }

  // Get balance from SMM API
  async getBalance() {
    try {
      const client = this.createApiClient();
      const response = await client.get('/balance');

      if (response.data && response.data.balance !== undefined) {
        return {
          success: true,
          balance: parseFloat(response.data.balance),
          currency: response.data.currency || 'USD'
        };
      }

      return { success: false, error: 'Invalid response' };
    } catch (error) {
      console.error('Error getting balance from SMM API:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Get services from SMM API
  async getServices() {
    try {
      const client = this.createApiClient();
      const response = await client.get('/services');

      if (response.data && Array.isArray(response.data.services)) {
        return {
          success: true,
          services: response.data.services
        };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('Error getting services from SMM API:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
}

module.exports = new SMMAPIService();

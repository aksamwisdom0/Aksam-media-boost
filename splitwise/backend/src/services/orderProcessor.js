const cron = require('node-cron');
const Order = require('../models/Order');
const smmApi = require('./smmApi');

class OrderProcessor {
  constructor() {
    this.processingOrders = new Set();
    this.setupCronJobs();
  }

  // Setup cron jobs for order processing
  setupCronJobs() {
    // Check order status every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('Running order status check...');
      await this.checkOrderStatuses();
    });

    // Process pending orders every minute
    cron.schedule('* * * * *', async () => {
      console.log('Processing pending orders...');
      await this.processPendingOrders();
    });

    // Clean up old completed orders daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Cleaning up old orders...');
      await this.cleanupOldOrders();
    });

    // Update service statistics hourly
    cron.schedule('0 * * * *', async () => {
      console.log('Updating service statistics...');
      await this.updateServiceStatistics();
    });

    console.log('Order processor cron jobs initialized');
  }

  // Process pending orders
  async processPendingOrders() {
    try {
      const pendingOrders = await Order.find({
        status: 'pending',
        apiOrderId: { $exists: false }
      }).limit(10); // Process max 10 orders per minute

      for (const order of pendingOrders) {
        if (this.processingOrders.has(order._id.toString())) {
          continue; // Skip if already processing
        }

        this.processingOrders.add(order._id.toString());
        
        try {
          console.log(`Processing order ${order._id}...`);
          
          // Get service details
          const service = await require('../models/Service').findById(order.service);
          if (!service) {
            console.error(`Service not found for order ${order._id}`);
            continue;
          }

          // Place order to SMM API
          const result = await smmApi.placeOrder(order);
          
          if (result.success) {
            console.log(`Order ${order._id} placed successfully with API ID: ${result.apiOrderId}`);
          } else {
            console.error(`Failed to place order ${order._id}:`, result.error);
          }
        } catch (error) {
          console.error(`Error processing order ${order._id}:`, error);
        } finally {
          this.processingOrders.delete(order._id.toString());
        }
      }
    } catch (error) {
      console.error('Error in processPendingOrders:', error);
    }
  }

  // Check order statuses from API
  async checkOrderStatuses() {
    try {
      const activeOrders = await Order.find({
        status: { $in: ['processing', 'in_progress', 'partial'] },
        apiOrderId: { $exists: true }
      }).limit(50); // Check max 50 orders per cycle

      console.log(`Checking status for ${activeOrders.length} active orders...`);

      for (const order of activeOrders) {
        if (this.processingOrders.has(order._id.toString())) {
          continue; // Skip if already processing
        }

        this.processingOrders.add(order._id.toString());

        try {
          console.log(`Checking status for order ${order._id} (API ID: ${order.apiOrderId})...`);
          
          const apiStatus = await smmApi.checkOrderStatus(order);
          
          if (apiStatus) {
            const updated = await smmApi.updateOrderStatus(order, apiStatus);
            if (updated) {
              console.log(`Order ${order._id} status updated to ${order.status}`);
            }
          } else {
            console.warn(`No status returned for order ${order._id}`);
          }
        } catch (error) {
          console.error(`Error checking status for order ${order._id}:`, error);
        } finally {
          this.processingOrders.delete(order._id.toString());
        }
      }
    } catch (error) {
      console.error('Error in checkOrderStatuses:', error);
    }
  }

  // Clean up old completed orders
  async cleanupOldOrders() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Archive old completed orders
      const result = await Order.updateMany(
        {
          status: { $in: ['completed', 'refunded'] },
          createdAt: { $lt: thirtyDaysAgo }
        },
        { 
          $set: { 
            archived: true,
            archivedAt: new Date()
          }
        }
      );

      console.log(`Archived ${result.modifiedCount} old orders`);

      // Delete very old orders (90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deleteResult = await Order.deleteMany({
        archived: true,
        archivedAt: { $lt: ninetyDaysAgo }
      });

      console.log(`Deleted ${deleteResult.deletedCount} archived orders`);
    } catch (error) {
      console.error('Error in cleanupOldOrders:', error);
    }
  }

  // Update service statistics
  async updateServiceStatistics() {
    try {
      const Service = require('../models/Service');
      const services = await Service.find({ isActive: true });

      for (const service of services) {
        try {
          // Calculate success rate
          const totalOrders = await Order.countDocuments({ 
            service: service._id,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          });

          const completedOrders = await Order.countDocuments({ 
            service: service._id,
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          });

          const successRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100;

          // Calculate average completion time
          const completedOrdersWithTime = await Order.find({
            service: service._id,
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            actualCompletion: { $exists: true }
          }).select('createdAt actualCompletion');

          let avgCompletionTime = 0;
          if (completedOrdersWithTime.length > 0) {
            const totalTime = completedOrdersWithTime.reduce((sum, order) => {
              return sum + (order.actualCompletion - order.createdAt);
            }, 0);
            avgCompletionTime = totalTime / completedOrdersWithTime.length / (1000 * 60 * 60); // Convert to hours
          }

          // Update service statistics
          await Service.findByIdAndUpdate(service._id, {
            'statistics.successRate': Math.round(successRate * 100) / 100,
            'statistics.averageCompletionTime': Math.round(avgCompletionTime * 100) / 100,
            'statistics.totalOrders': totalOrders
          });

        } catch (error) {
          console.error(`Error updating statistics for service ${service._id}:`, error);
        }
      }

      console.log('Service statistics updated successfully');
    } catch (error) {
      console.error('Error in updateServiceStatistics:', error);
    }
  }

  // Manual order processing (for immediate processing)
  async processOrderManually(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (this.processingOrders.has(order._id.toString())) {
        throw new Error('Order is already being processed');
      }

      this.processingOrders.add(order._id.toString());

      if (order.status === 'pending' && !order.apiOrderId) {
        // Place order to API
        const result = await smmApi.placeOrder(order);
        return result;
      } else if (order.apiOrderId) {
        // Check status
        const apiStatus = await smmApi.checkOrderStatus(order);
        if (apiStatus) {
          const updated = await smmApi.updateOrderStatus(order, apiStatus);
          return { success: updated, order };
        }
      }

      return { success: false, error: 'No action taken' };
    } catch (error) {
      console.error(`Error manually processing order ${orderId}:`, error);
      return { success: false, error: error.message };
    } finally {
      this.processingOrders.delete(orderId);
    }
  }

  // Get processing statistics
  getProcessingStats() {
    return {
      currentlyProcessing: this.processingOrders.size,
      processingOrders: Array.from(this.processingOrders)
    };
  }

  // Handle drip feed orders
  async processDripFeedOrders() {
    try {
      const dripFeedOrders = await Order.find({
        status: 'processing',
        'dripFeedSettings.enabled': true,
        'dripFeedSettings.runs': { $gt: 0 },
        'dripFeedSettings.quantityPerRun': { $gt: 0 }
      });

      for (const order of dripFeedOrders) {
        // Check if it's time for next run
        const lastRun = order.dripFeedSettings.lastRun || order.createdAt;
        const intervalMs = order.dripFeedSettings.interval * 60 * 1000; // Convert minutes to milliseconds
        const nextRun = new Date(lastRun.getTime() + intervalMs);

        if (new Date() >= nextRun && order.dripFeedSettings.currentRun < order.dripFeedSettings.runs) {
          // Process next run
          const quantityToAdd = Math.min(
            order.dripFeedSettings.quantityPerRun,
            order.remainingCount
          );

          // Update order progress
          order.currentCount += quantityToAdd;
          order.dripFeedSettings.currentRun = (order.dripFeedSettings.currentRun || 0) + 1;
          order.dripFeedSettings.lastRun = new Date();

          if (order.currentCount >= order.quantity || order.dripFeedSettings.currentRun >= order.dripFeedSettings.runs) {
            order.status = 'completed';
            order.actualCompletion = new Date();
          }

          await order.save();
          console.log(`Processed drip feed run for order ${order._id}: ${quantityToAdd} units added`);
        }
      }
    } catch (error) {
      console.error('Error in processDripFeedOrders:', error);
    }
  }
}

// Create and export singleton instance
const orderProcessor = new OrderProcessor();

module.exports = orderProcessor;

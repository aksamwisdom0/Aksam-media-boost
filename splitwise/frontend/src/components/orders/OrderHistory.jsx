import React, { useState, useEffect } from 'react';
import { useOrders } from '../../hooks/useOrders';
import Loading from '../common/Loading';

const OrderHistory = () => {
  const { getUserOrders } = useOrders();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getUserOrders(filters.page, filters.limit, filters.status);
        setOrders(data.orders);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [getUserOrders, filters]);

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && orders.length === 0) {
    return <Loading />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Order History</h2>
        
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' }
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusFilter(status.value)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                filters.status === status.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3">
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {order.serviceDetails.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Order ID: {order._id.slice(-8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-3 lg:mt-0">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.charge.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{order.quantity} units</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar for Partial Orders */}
              {order.status === 'partial' && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{order.currentCount}/{order.quantity} ({order.progress?.percentage || 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(order.progress?.percentage || 0)}`}
                      style={{ width: `${order.progress?.percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Target:</span>
                  <p className="text-gray-900 truncate" title={order.targetLink}>
                    {order.targetLink}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Start Count:</span>
                  <p className="text-gray-900">{order.startCount || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Current Count:</span>
                  <p className="text-gray-900">{order.currentCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Remaining:</span>
                  <p className="text-gray-900">{order.remainingCount}</p>
                </div>
              </div>

              {/* Additional Info */}
              {(order.dripFeedSettings?.enabled || order.customComments?.length > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-4 text-xs">
                    {order.dripFeedSettings?.enabled && (
                      <span className="flex items-center text-gray-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Drip Feed: {order.dripFeedSettings.runs} runs
                      </span>
                    )}
                    {order.customComments?.length > 0 && (
                      <span className="flex items-center text-gray-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        {order.customComments.length} custom comments
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Failure Reason */}
              {order.failureReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    <strong>Failure Reason:</strong> {order.failureReason}
                  </p>
                </div>
              )}

              {/* Refund Info */}
              {order.refundAmount > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">
                    <strong>Refund Amount:</strong> ${order.refundAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-4">
            {filters.status ? `No ${filters.status} orders found.` : 'You haven\'t placed any orders yet.'}
          </p>
          <button
            onClick={() => window.location.href = '/services'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Services
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {[...Array(pagination.totalPages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === pagination.currentPage;
              const isNearCurrent = Math.abs(page - pagination.currentPage) <= 1 || 
                                  page === 1 || 
                                  page === pagination.totalPages;
              
              if (!isNearCurrent && page !== 1 && page !== pagination.totalPages) {
                if (page === pagination.currentPage - 2 || page === pagination.currentPage + 2) {
                  return (
                    <span key={page} className="px-3 py-2 text-sm text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isCurrentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

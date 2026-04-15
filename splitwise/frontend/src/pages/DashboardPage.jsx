import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import { useTransactions } from '../hooks/useTransactions';
import Wallet from '../components/dashboard/Wallet';
import OrderHistory from '../components/orders/OrderHistory';
import StatsCard from '../components/dashboard/StatsCard';
import Loading from '../components/common/Loading';

const DashboardPage = () => {
  const { user } = useAuth();
  const { getUserOrders, getOrderStatistics } = useOrders();
  const { getTransactions } = useTransactions();
  
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent orders
        const ordersData = await getUserOrders(1, 5);
        setOrders(ordersData.orders);

        // Fetch recent transactions
        const transactionsData = await getTransactions(1, 5);
        setTransactions(transactionsData.transactions);

        // Fetch order statistics
        const statsData = await getOrderStatistics();
        setOrderStats(statsData.overallStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getUserOrders, getTransactions, getOrderStatistics]);

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

  const getTransactionTypeColor = (type) => {
    const colors = {
      deposit: 'text-green-600',
      spent: 'text-red-600',
      refund: 'text-blue-600',
      bonus: 'text-purple-600',
      withdraw: 'text-orange-600',
      penalty: 'text-red-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '💰',
      spent: '💸',
      refund: '🔄',
      bonus: '🎁',
      withdraw: '🏦',
      penalty: '⚠️'
    };
    return icons[type] || '📄';
  };

  if (loading) {
    return <Loading />;
  }

  const stats = [
    {
      title: 'Total Balance',
      value: `$${user.balance.toFixed(2)}`,
      description: 'Available funds',
      icon: '💳',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Orders',
      value: orderStats?.totalOrders || 0,
      description: 'Orders placed',
      icon: '📦',
      color: 'bg-green-500'
    },
    {
      title: 'Total Spent',
      value: `$${(orderStats?.totalSpent || 0).toFixed(2)}`,
      description: 'Lifetime spending',
      icon: '💰',
      color: 'bg-purple-500'
    },
    {
      title: 'Avg Order Value',
      value: `$${(orderStats?.avgOrderValue || 0).toFixed(2)}`,
      description: 'Average per order',
      icon: '📊',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600">
          Manage your orders, track your progress, and grow your social media presence.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'orders', 'transactions', 'wallet'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Recent Orders and Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order._id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <p className="font-medium text-gray-900">{order.serviceDetails.name}</p>
                          <p className="text-sm text-gray-600">
                            {order.quantity} units • ${order.charge.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.currentCount > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              {order.currentCount}/{order.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No orders yet</p>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction._id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getTransactionIcon(transaction.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                            {transaction.type === 'spent' || transaction.type === 'withdraw' || transaction.type === 'penalty' ? '-' : '+'}
                            ${transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${transaction.balanceAfter.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <OrderHistory />
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h2>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance After
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{getTransactionIcon(transaction.type)}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type === 'spent' || transaction.type === 'withdraw' || transaction.type === 'penalty' ? '-' : '+'}
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.balanceAfter.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions found</p>
          )}
        </div>
      )}

      {activeTab === 'wallet' && (
        <Wallet />
      )}
    </div>
  );
};

export default DashboardPage;

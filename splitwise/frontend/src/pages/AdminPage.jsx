import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import UserManagement from '../components/admin/UserManagement';
import OrderManagement from '../components/admin/OrderManagement';
import ServiceManagement from '../components/admin/ServiceManagement';
import StatsCard from '../components/dashboard/StatsCard';
import Loading from '../components/common/Loading';

const AdminPage = () => {
  const { user } = useAuth();
  const { getDashboardStats } = useAdmin();
  
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const stats = await getDashboardStats();
        setDashboardStats(stats.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [getDashboardStats]);

  if (loading) {
    return <Loading />;
  }

  const stats = [
    {
      title: 'Total Users',
      value: dashboardStats?.users?.total || 0,
      description: `${dashboardStats?.users?.newToday || 0} new today`,
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Orders',
      value: dashboardStats?.orders?.total || 0,
      description: `${dashboardStats?.orders?.pending || 0} pending`,
      icon: '📦',
      color: 'bg-green-500'
    },
    {
      title: 'Total Revenue',
      value: `$${(dashboardStats?.revenue?.total || 0).toFixed(2)}`,
      description: `$${(dashboardStats?.revenue?.today || 0).toFixed(2)} today`,
      icon: '💰',
      color: 'bg-purple-500'
    },
    {
      title: 'Active Services',
      value: dashboardStats?.services?.total || 0,
      description: `${dashboardStats?.services?.popular || 0} popular`,
      icon: '🚀',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage users, orders, services, and monitor system performance.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'users', 'orders', 'services'].map((tab) => (
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
              {dashboardStats?.recentOrders?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.recentOrders.map((order) => (
                    <div key={order._id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <p className="font-medium text-gray-900">{order.serviceDetails.name}</p>
                          <p className="text-sm text-gray-600">
                            {order.user?.firstName} {order.user?.lastName} • {order.quantity} units
                          </p>
                          <p className="text-xs text-gray-500">
                            ${order.charge.toFixed(2)} • {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
              {dashboardStats?.recentTransactions?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-center">
                        <div className="flex-grow">
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.user?.firstName} {transaction.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'bonus' || transaction.type === 'refund' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'spent' || transaction.type === 'withdraw' || transaction.type === 'penalty' ? '-' : '+'}
                            ${transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          {dashboardStats?.revenue?.monthly?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
              <div className="space-y-2">
                {dashboardStats.revenue.monthly.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center space-x-4">
                      <div className="flex-grow max-w-xs">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(month.revenue / Math.max(...dashboardStats.revenue.monthly.map(m => m.revenue))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                        ${month.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <UserManagement />
      )}

      {activeTab === 'orders' && (
        <OrderManagement />
      )}

      {activeTab === 'services' && (
        <ServiceManagement />
      )}
    </div>
  );
};

export default AdminPage;

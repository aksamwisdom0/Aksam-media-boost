import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import Loading from '../common/Loading';

const Wallet = () => {
  const { user, addFunds, withdrawFunds } = useAuth();
  const { getTransactions } = useTransactions();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'paypal',
    paymentDetails: {
      transactionId: '',
      gateway: 'paypal'
    }
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getTransactions(1, 20, ['deposit', 'withdraw', 'refund', 'bonus']);
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [getTransactions]);

  const validateAmount = (amount) => {
    const num = parseFloat(amount);
    if (!amount || num <= 0) {
      return 'Amount must be greater than 0';
    }
    if (num < 1) {
      return 'Minimum amount is $1';
    }
    if (num > 10000) {
      return 'Maximum amount is $10,000';
    }
    return null;
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    
    const amountError = validateAmount(formData.amount);
    if (amountError) {
      setErrors({ amount: amountError });
      return;
    }

    setSubmitting(true);
    try {
      await addFunds(formData);
      setShowAddFunds(false);
      setFormData({
        amount: '',
        paymentMethod: 'paypal',
        paymentDetails: {
          transactionId: '',
          gateway: 'paypal'
        }
      });
      // Refresh transactions
      const data = await getTransactions(1, 20, ['deposit', 'withdraw', 'refund', 'bonus']);
      setTransactions(data.transactions);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add funds' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amountError = validateAmount(formData.amount);
    if (amountError) {
      setErrors({ amount: amountError });
      return;
    }

    if (parseFloat(formData.amount) > user.balance) {
      setErrors({ amount: 'Insufficient balance' });
      return;
    }

    setSubmitting(true);
    try {
      await withdrawFunds(formData);
      setShowWithdraw(false);
      setFormData({
        amount: '',
        paymentMethod: 'paypal',
        paymentDetails: {
          transactionId: '',
          gateway: 'paypal'
        }
      });
      // Refresh transactions
      const data = await getTransactions(1, 20, ['deposit', 'withdraw', 'refund', 'bonus']);
      setTransactions(data.transactions);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to withdraw funds' });
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '💰',
      withdraw: '🏦',
      refund: '🔄',
      bonus: '🎁'
    };
    return icons[type] || '📄';
  };

  const getTransactionColor = (type) => {
    const colors = {
      deposit: 'text-green-600',
      withdraw: 'text-red-600',
      refund: 'text-blue-600',
      bonus: 'text-purple-600'
    };
    return colors[type] || 'text-gray-600';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
            <p className="text-4xl font-bold">${user.balance.toFixed(2)}</p>
            <p className="text-blue-100 mt-2">Available for orders</p>
          </div>
          <div className="text-right space-y-2">
            <button
              onClick={() => setShowAddFunds(true)}
              className="block w-full px-4 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors"
            >
              Add Funds
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="block w-full px-4 py-2 bg-transparent border-2 border-white text-white font-medium rounded-md hover:bg-white hover:text-blue-600 transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Deposited</p>
              <p className="text-xl font-bold text-gray-900">
                ${transactions
                  .filter(t => t.type === 'deposit')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-red-100 rounded-lg">
              <span className="text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">
                ${user.apiUsage?.totalSpent?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎁</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bonus Received</p>
              <p className="text-xl font-bold text-gray-900">
                ${transactions
                  .filter(t => t.type === 'bonus')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getTransactionIcon(transaction.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{transaction.type}</p>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'withdraw' ? '-' : '+'}
                      ${transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: ${transaction.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        )}
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Funds</h3>
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, amount: e.target.value }));
                    if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  min="1"
                  max="10000"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFunds(false);
                    setErrors({});
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
                  {submitting ? 'Processing...' : 'Add Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h3>
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, amount: e.target.value }));
                    if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  min="1"
                  max={user.balance}
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Available balance: ${user.balance.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdraw(false);
                    setErrors({});
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
                  {submitting ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;

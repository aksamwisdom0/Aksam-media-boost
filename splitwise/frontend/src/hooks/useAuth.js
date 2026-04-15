import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set axios default
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Login user (email-based)
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set axios default
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Admin login (username-based)
  const adminLogin = async (credentials) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/admin/login', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set axios default
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Admin login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Admin login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get current user
  const getMe = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      
      if (response.data.success) {
        const { user } = response.data.data;
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get user data');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get user data';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await axios.put('/api/auth/profile', profileData);
      
      if (response.data.success) {
        const { user } = response.data.data;
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const response = await axios.put('/api/auth/change-password', passwordData);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/refresh-token');
      
      if (response.data.success) {
        const { token } = response.data.data;
        
        // Update localStorage
        localStorage.setItem('token', token);
        
        // Set axios default
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Token refresh failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Token refresh failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear axios default
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear state
    setUser(null);
    setError(null);
    
    // Redirect to login
    navigate('/login');
  };

  // Add funds to wallet
  const addFunds = async (fundData) => {
    try {
      setError(null);
      const response = await axios.post('/api/user/add-funds', fundData);
      
      if (response.data.success) {
        // Update user balance in state
        if (user) {
          const updatedUser = { ...user, balance: user.balance + fundData.amount };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Add funds failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Add funds failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Withdraw funds from wallet
  const withdrawFunds = async (withdrawData) => {
    try {
      setError(null);
      const response = await axios.post('/api/user/withdraw-funds', withdrawData);
      
      if (response.data.success) {
        // Update user balance in state
        if (user) {
          const updatedUser = { ...user, balance: user.balance - withdrawData.amount };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Withdraw failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Withdraw failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return {
    user,
    loading,
    error,
    register,
    login,
    adminLogin,
    getMe,
    updateProfile,
    changePassword,
    refreshToken,
    logout,
    addFunds,
    withdrawFunds,
    isAdmin
  };
};

export default useAuth;

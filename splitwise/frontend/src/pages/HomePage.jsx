import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import ServiceCard from '../components/services/ServiceCard';
import StatsCard from '../components/dashboard/StatsCard';
import Loading from '../components/common/Loading';

const HomePage = () => {
  const { user } = useAuth();
  const { getPopularServices } = useServices();
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        const data = await getPopularServices(6);
        setPopularServices(data.services);
      } catch (error) {
        console.error('Error fetching popular services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularServices();
  }, [getPopularServices]);

  const stats = [
    {
      title: 'Total Orders',
      value: '50,000+',
      description: 'Orders completed successfully',
      icon: '📦'
    },
    {
      title: 'Active Users',
      value: '10,000+',
      description: 'Trusted customers worldwide',
      icon: '👥'
    },
    {
      title: 'Services',
      value: '100+',
      description: 'Different social media services',
      icon: '🚀'
    },
    {
      title: 'Satisfaction',
      value: '99%',
      description: 'Customer satisfaction rate',
      icon: '⭐'
    }
  ];

  const categories = [
    { name: 'Instagram Followers', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { name: 'Facebook Likes', icon: '👍', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'YouTube Views', icon: '🎥', color: 'bg-gradient-to-r from-red-500 to-red-600' },
    { name: 'TikTok Followers', icon: '🎵', color: 'bg-gradient-to-r from-gray-800 to-gray-900' },
    { name: 'Twitter Followers', icon: '🐦', color: 'bg-gradient-to-r from-sky-400 to-sky-500' },
    { name: 'LinkedIn Connections', icon: '💼', color: 'bg-gradient-to-r from-blue-600 to-blue-700' }
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Boost Your Social Media
              <span className="block text-yellow-300">Presence Instantly</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              The #1 SMM Panel for Real & Fast Social Media Services
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors text-lg"
              >
                Browse Services
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors text-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-colors text-lg"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600">
              Choose from our wide range of social media services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/services?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`h-32 ${category.color} flex items-center justify-center`}>
                    <span className="text-5xl">{category.icon}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Starting from $0.01
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Services
            </h2>
            <p className="text-xl text-gray-600">
              Our most requested social media services
            </p>
          </div>
          {popularServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularServices.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No popular services available at the moment.</p>
            </div>
          )}
          <div className="text-center mt-12">
            <Link
              to="/services"
              className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Aksam Media Boost?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Delivery
              </h3>
              <p className="text-gray-600">
                Get your orders processed and delivered within minutes
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                100% Safe
              </h3>
              <p className="text-gray-600">
                All our services are safe and comply with platform terms
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                24/7 Support
              </h3>
              <p className="text-gray-600">
                Our support team is always here to help you
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Best Prices
              </h3>
              <p className="text-gray-600">
                Competitive pricing with no hidden fees
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Refill Guarantee
              </h3>
              <p className="text-gray-600">
                30-day refill guarantee on all applicable services
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-Time Tracking
              </h3>
              <p className="text-gray-600">
                Track your orders in real-time from your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Boost Your Social Media?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of satisfied customers and grow your online presence today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors text-lg"
            >
              Start Now
            </Link>
            <Link
              to="/services"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-colors text-lg"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

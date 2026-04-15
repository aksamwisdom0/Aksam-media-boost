import React from 'react';
import { Link } from 'react-router-dom';

const ServiceCard = ({ service }) => {
  const calculateCharge = (quantity) => {
    return (service.price * quantity).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {service.name}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {service.category}
            </span>
          </div>
          {service.isPopular && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Popular
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {service.description || 'High-quality social media service to boost your online presence.'}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Price:</span>
            <span className="font-semibold text-gray-900">${service.price}/unit</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Quantity:</span>
            <span className="text-gray-900">
              {service.minQuantity} - {service.maxQuantity}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery:</span>
            <span className="text-gray-900">{service.averageTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {service.refill && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                Refill
              </span>
            )}
            {service.dripFeed && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Drip Feed
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">From</div>
            <div className="text-lg font-bold text-blue-600">
              ${calculateCharge(service.minQuantity)}
            </div>
          </div>
        </div>

        <Link
          to={`/order/${service._id}`}
          className="w-full block text-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Order Now
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;

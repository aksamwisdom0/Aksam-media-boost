import React, { useState } from 'react';

const ServiceFilter = ({ categories, filters, onFilterChange, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (category) => {
    onFilterChange({ category: filters.category === category ? '' : category });
  };

  const handleSortChange = (sortBy, sortOrder) => {
    onFilterChange({ sortBy, sortOrder });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onSearch('');
    onFilterChange({
      category: '',
      sortBy: 'price',
      sortOrder: 'asc',
      page: 1
    });
  };

  const hasActiveFilters = filters.category || filters.search;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Services</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters - Always visible on desktop, toggleable on mobile */}
      <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
        {/* Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === category}
                  onChange={() => handleCategoryChange(category)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sort By</h4>
          <div className="space-y-2">
            {[
              { label: 'Price: Low to High', sortBy: 'price', sortOrder: 'asc' },
              { label: 'Price: High to Low', sortBy: 'price', sortOrder: 'desc' },
              { label: 'Name: A to Z', sortBy: 'name', sortOrder: 'asc' },
              { label: 'Name: Z to A', sortBy: 'name', sortOrder: 'desc' },
              { label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' }
            ].map((option) => (
              <label key={`${option.sortBy}-${option.sortOrder}`} className="flex items-center">
                <input
                  type="radio"
                  name="sort"
                  checked={filters.sortBy === option.sortBy && filters.sortOrder === option.sortOrder}
                  onChange={() => handleSortChange(option.sortBy, option.sortOrder)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceFilter;

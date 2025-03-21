import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { eventApi } from '../services/api';
import { Select } from '../components/ui/Select';

// Default placeholder image for events without images
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';

const CATEGORIES = [
  'All',
  'Music',
  'Sports',
  'Arts',
  'Food',
  'Business',
  'Education',
  'Other'
];

const PRICE_RANGES = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹500', value: '0-500' },
  { label: '₹500 - ₹1000', value: '500-1000' },
  { label: '₹1000 - ₹2000', value: '1000-2000' },
  { label: 'Over ₹2000', value: '2000+' }
];

const Events = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'All',
    priceRange: 'all',
    location: '',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async (search = '') => {
    try {
      setLoading(true);
      const params = {
        search,
        category: filters.category !== 'All' ? filters.category : undefined,
        price_range: filters.priceRange !== 'all' ? filters.priceRange : undefined,
        location: filters.location || undefined,
        date_range: filters.dateRange !== 'all' ? filters.dateRange : undefined
      };
      const response = await eventApi.getEvents(params);
      setEvents(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events. Please try again later.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    fetchEvents(term);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleViewDetails = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Events</h1>
          
          {/* Search and Filters Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <Input
                  type="text"
                  placeholder="Search events by name, category, or location"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full"
                />
              </div>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
              <Select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full"
              >
                {PRICE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                type="text"
                placeholder="Filter by location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full"
              />
              <Select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="future">Future Events</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={event.image_url ? `http://127.0.0.1:8000${event.image_url}` : DEFAULT_IMAGE}
                  alt={event.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGE;
                    e.target.onerror = null;
                  }}
                />
              </div>
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>{event.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="flex items-center text-sm text-gray-500">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </p>
                  <p className="flex items-center text-sm text-gray-500">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </p>
                  <p className="flex items-center text-sm text-gray-500">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {event.venue}
                  </p>
                  <p className="text-lg font-semibold text-blue-600">
                    ₹{event.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewDetails(event.id)}
                >
                  View Details
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                >
                  Purchase Ticket
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
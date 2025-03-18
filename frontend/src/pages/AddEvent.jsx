import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { eventApi } from '../services/api';
import api from '../services/api';

const AddEvent = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    address: '',
    price: '',
    available_tickets: '',
    image: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await api.get('/wallet');
      setWallet(response.data.wallet);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleRequestRecommendation = async (type) => {
    if (!wallet || wallet.coins < 10) {
      alert('Insufficient coins. Please top up your wallet.');
      return;
    }

    setRecommendationLoading(true);
    try {
      const response = await api.post('/wallet/request-recommendation', {
        type,
        coins: 10
      });

      setWallet(prev => ({
        ...prev,
        coins: response.data.new_balance
      }));

      alert('Recommendation request submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request recommendation');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Event name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.venue) newErrors.venue = 'Venue is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.available_tickets) newErrors.available_tickets = 'Available tickets is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      const numericPrice = parseFloat(formData.price);
      const numericTickets = parseInt(formData.available_tickets, 10);

      if (isNaN(numericPrice) || numericPrice < 0) {
        setErrors(prev => ({ ...prev, price: 'Please enter a valid price' }));
        return;
      }

      if (isNaN(numericTickets) || numericTickets < 0) {
        setErrors(prev => ({ ...prev, available_tickets: 'Please enter a valid number of tickets' }));
        return;
      }

      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category.trim());
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('location', formData.location.trim());
      formDataToSend.append('venue', formData.venue.trim());
      formDataToSend.append('address', formData.address.trim());
      formDataToSend.append('price', numericPrice);
      formDataToSend.append('available_tickets', numericTickets);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await eventApi.createEvent(formDataToSend);
      alert('Event created successfully!');
      navigate('/events');
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        const newErrors = {};
        Object.keys(serverErrors).forEach(key => {
          newErrors[key] = Array.isArray(serverErrors[key]) 
            ? serverErrors[key][0] 
            : serverErrors[key];
        });
        setErrors(newErrors);
        
        const errorMessages = Object.values(serverErrors)
          .map(err => Array.isArray(err) ? err[0] : err)
          .join('\n');
        alert('Validation errors:\n' + errorMessages);
      } else {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Failed to create event. Please try again.';
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Music',
    'Technology',
    'Sports',
    'Arts',
    'Food & Drink',
    'Business',
    'Education',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {wallet && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Available Coins: {wallet.coins}</p>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                  placeholder="Describe your event"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <div className="flex gap-2">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`flex-1 mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRequestRecommendation('category')}
                    disabled={recommendationLoading || !wallet || wallet.coins < 10}
                    className="mt-1"
                  >
                    Get Recommendation (10 coins)
                  </Button>
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={errors.date}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <Input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    error={errors.time}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={errors.location}
                    placeholder="Enter city or region"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRequestRecommendation('location')}
                    disabled={recommendationLoading || !wallet || wallet.coins < 10}
                  >
                    Get Recommendation (10 coins)
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Venue</label>
                <Input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  error={errors.venue}
                  placeholder="Enter venue name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  placeholder="Enter full venue address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      error={errors.price}
                      placeholder="Enter ticket price"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRequestRecommendation('pricing')}
                      disabled={recommendationLoading || !wallet || wallet.coins < 10}
                    >
                      Get Recommendation (10 coins)
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Tickets</label>
                  <Input
                    type="number"
                    name="available_tickets"
                    value={formData.available_tickets}
                    onChange={handleChange}
                    error={errors.available_tickets}
                    placeholder="Enter number of tickets"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Event Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/events')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creating Event...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddEvent;
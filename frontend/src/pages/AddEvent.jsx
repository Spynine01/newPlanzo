import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { eventApi } from '../services/api';
import api from '../services/api';
import { toast } from 'react-hot-toast';

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
  const [pendingEventId, setPendingEventId] = useState(null);
  const [pendingRecommendations, setPendingRecommendations] = useState([]);
  const [allRecommendationsApproved, setAllRecommendationsApproved] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (pendingEventId) {
      const checkRecommendations = async () => {
        try {
          const response = await api.get(`/pending-events/${pendingEventId}/recommendations`);
          const pendingRecs = response.data.filter(rec => rec.status === 'pending');
          const approvedRecs = response.data.filter(rec => rec.status === 'approved');
          
          setPendingRecommendations(pendingRecs.map(rec => rec.type));
          
          // Update form with approved recommendations
          if (approvedRecs.length > 0) {
            const newFormData = { ...formData };
            approvedRecs.forEach(rec => {
              if (rec.type && rec.recommendation) {
                newFormData[rec.type] = rec.recommendation;
              }
            });
            setFormData(newFormData);
          }

          // Check if all requested recommendations are approved
          const allApproved = pendingRecs.length === 0 && approvedRecs.length > 0;
          setAllRecommendationsApproved(allApproved);

          // If all recommendations are approved, finalize the event
          if (allApproved) {
            await finalizeEvent();
          }
        } catch (error) {
          console.error('Error checking recommendations:', error);
        }
      };

      const interval = setInterval(checkRecommendations, 5000);
      return () => clearInterval(interval);
    }
  }, [pendingEventId, formData]);

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
    setRecommendationLoading(true);
    try {
      // Request recommendation without creating event first
      const response = await api.post('/wallet/request-recommendation', {
        type: type
      });

      if (response.status === 200) {
        toast.success(`${type} recommendation requested successfully`);
        setWallet(prevData => ({
          ...prevData,
          coins: response.data.balance
        }));
        setPendingEventId(response.data.pending_event_id);
        setPendingRecommendations(prev => [...prev, type]);
      }
    } catch (error) {
      console.error('Error requesting recommendation:', error);
      toast.error(error.response?.data?.message || 'Error requesting recommendation');
    }
    setRecommendationLoading(false);
  };

  const finalizeEvent = async () => {
    try {
      const response = await eventApi.finalizePendingEvent(pendingEventId, formData);
      if (response.status === 200) {
        toast.success('Event created successfully with all recommendations!');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error finalizing event:', error);
      toast.error(error.response?.data?.message || 'Error finalizing event');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create a copy of formData and remove empty values
      const submitData = { ...formData };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      let response;
      if (pendingEventId) {
        // Update existing pending event
        response = await eventApi.updatePendingEvent(pendingEventId, submitData);
      } else {
        // Create new pending event
        response = await eventApi.createPendingEvent(submitData);
        setPendingEventId(response.data.pending_event.id);
      }

      if (response.status === 200 || response.status === 201) {
        toast.success('Event saved successfully');
        
        // If all required fields are filled and no pending recommendations, finalize the event
        if (validateForm() && pendingRecommendations.length === 0) {
          await eventApi.finalizePendingEvent(response.data.pending_event.id, submitData);
          toast.success('Event created and published!');
          navigate('/events');
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error.response?.data?.message || 'Error saving event');
    }
    setLoading(false);
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = {
      name: 'Event name',
      description: 'Description',
      category: 'Category',
      date: 'Date',
      time: 'Time',
      location: 'Location',
      venue: 'Venue',
      address: 'Address',
      price: 'Price',
      available_tickets: 'Available tickets'
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field]) {
        newErrors[field] = `${label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const isRecommendationPending = (type) => {
    return pendingRecommendations.includes(type);
  };

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
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRequestRecommendation('location')}
                    disabled={loading || recommendationLoading || isRecommendationPending('location') || !wallet || wallet.coins < 10}
                  >
                    {isRecommendationPending('location') ? 'Waiting for approval...' : 'Request Location Recommendation (10 coins)'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Venue</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    error={errors.venue}
                    placeholder="Enter venue name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRequestRecommendation('venue')}
                    disabled={loading || recommendationLoading || isRecommendationPending('venue') || !wallet || wallet.coins < 10}
                  >
                    {isRecommendationPending('venue') ? 'Waiting for approval...' : 'Request Venue Recommendation (10 coins)'}
                  </Button>
                </div>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Tickets</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      name="available_tickets"
                      value={formData.available_tickets}
                      onChange={handleChange}
                      error={errors.available_tickets}
                      placeholder="Enter number of tickets"
                      min="0"
                      step="1"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRequestRecommendation('tickets')}
                      disabled={loading || recommendationLoading || isRecommendationPending('tickets') || !wallet || wallet.coins < 10}
                    >
                      {isRecommendationPending('tickets') ? 'Waiting for approval...' : 'Request Tickets Recommendation (10 coins)'}
                    </Button>
                  </div>
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
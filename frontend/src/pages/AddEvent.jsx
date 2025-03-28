import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { eventApi } from '../services/api';
import api from '../services/api';

const AddEvent = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
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

  const steps = [
    { number: 1, title: 'Basic Info' },
    { number: 2, title: 'Date & Time' },
    { number: 3, title: 'Location' },
    { number: 4, title: 'Tickets' },
    { number: 5, title: 'Image' }
  ];

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    
    // Check if user is an organizer
    if (role !== 'organizer') {
      navigate('/login', { state: { message: 'Only organizers can create events' } });
      return;
    }
    
    fetchWalletData();
  }, [navigate]);

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
        formData: {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          venue: formData.venue,
          address: formData.address,
          price: formData.price,
          available_tickets: formData.available_tickets
        },
        coins: 10
      });

      setWallet(prev => ({
        ...prev,
        coins: response.data.new_balance
      }));

      alert(`Recommendation request submitted successfully! Our experts will review your ${type} and provide guidance soon.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request recommendation');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name) newErrors.name = 'Event name is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (!formData.date) newErrors.date = 'Date is required';
        if (!formData.time) newErrors.time = 'Time is required';
        break;
      case 3:
        if (!formData.location) newErrors.location = 'Location is required';
        if (!formData.venue) newErrors.venue = 'Venue is required';
        if (!formData.address) newErrors.address = 'Address is required';
        break;
      case 4:
        if (!formData.price) newErrors.price = 'Price is required';
        if (!formData.available_tickets) newErrors.available_tickets = 'Available tickets is required';
        
        const numericPrice = parseFloat(formData.price);
        const numericTickets = parseInt(formData.available_tickets, 10);

        if (isNaN(numericPrice) || numericPrice < 0) {
          newErrors.price = 'Please enter a valid price';
        }
        if (isNaN(numericTickets) || numericTickets < 0) {
          newErrors.available_tickets = 'Please enter a valid number of tickets';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category.trim());
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('location', formData.location.trim());
      formDataToSend.append('venue', formData.venue.trim());
      formDataToSend.append('address', formData.address.trim());
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('available_tickets', parseInt(formData.available_tickets, 10));
      
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
                  
                  if (selectedDate < today) {
                    alert('Please select a present or future date');
                    return;
                  }
                  handleChange(e);
                }}
                min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              <p className="text-gray-500 text-sm mt-1">Select a present or future date</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <Input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={errors.time ? 'border-red-500' : ''}
              />
              {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
              <Button
                type="button"
                variant="outline"
                className="ml-4 mt-6"
                onClick={() => handleRequestRecommendation('location')}
                disabled={recommendationLoading || !wallet || wallet.coins < 10}
              >
                Get Location Recommendation (10 coins)
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700">Venue</label>
                <Input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className={errors.venue ? 'border-red-500' : ''}
                />
                {errors.venue && <p className="text-red-500 text-sm mt-1">{errors.venue}</p>}
              </div>
              <Button
                type="button"
                variant="outline"
                className="ml-4 mt-6"
                onClick={() => handleRequestRecommendation('venue')}
                disabled={recommendationLoading || !wallet || wallet.coins < 10}
              >
                Get Venue Recommendation (10 coins)
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            <div className="flex items-center">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700">Available Tickets</label>
                <Input
                  type="number"
                  name="available_tickets"
                  value={formData.available_tickets}
                  onChange={handleChange}
                  min="1"
                  className={errors.available_tickets ? 'border-red-500' : ''}
                />
                {errors.available_tickets && <p className="text-red-500 text-sm mt-1">{errors.available_tickets}</p>}
              </div>
              <Button
                type="button"
                variant="outline"
                className="ml-4 mt-6"
                onClick={() => handleRequestRecommendation('tickets')}
                disabled={recommendationLoading || !wallet || wallet.coins < 10}
              >
                Get Tickets Recommendation (10 coins)
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1"
            />
            {formData.image && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Event preview"
                  className="max-w-xs rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {wallet && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Available Coins: {wallet.coins}</p>
          </div>
        )}
        
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Event</CardTitle>
          </CardHeader>

          {/* Progress Bar */}
          <div className="px-6">
            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                ></div>
              </div>
              <div className="flex justify-between">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`flex flex-col items-center ${
                      step.number === currentStep
                        ? 'text-blue-600'
                        : step.number < currentStep
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`rounded-full transition duration-500 ease-in-out h-6 w-6 flex items-center justify-center ${
                        step.number === currentStep
                          ? 'bg-blue-600 text-white'
                          : step.number < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300'
                      }`}
                    >
                      {step.number < currentStep ? '✓' : step.number}
                    </div>
                    <div className="text-xs mt-1">{step.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <CardContent className="mt-6">
            <div className="space-y-6">
              {renderStepContent()}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Creating Event...' : 'Create Event'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddEvent;
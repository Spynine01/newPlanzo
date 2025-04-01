import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { eventApi, recommendationApi } from '../services/api';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Define the recommendation cost constant
const RECOMMENDATION_COST = 10;

const AddEvent = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
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

  const [recommendations, setRecommendations] = useState([]);

  const [recommendationPolling, setRecommendationPolling] = useState({
    location: null,
    venue: null,
    tickets: null
  });

  const steps = [
    { number: 1, title: 'Basic Info' },
    { number: 2, title: 'Date & Time' },
    { number: 3, title: 'Location' },
    { number: 4, title: 'Tickets' },
    { number: 5, title: 'Image' }
  ];

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');
    setUserRole(role);
    
    // Convert string ID to number (or keep as string if conversion fails)
    setUserId(id ? Number(id) || id : null);
    
    console.log('User ID loaded from localStorage:', id, 'converted to:', id ? Number(id) || id : null);
    
    // Check if user is an organizer
    if (role !== 'organizer') {
      navigate('/login', { state: { message: 'Only organizers can create events' } });
      return;
    }
    
    fetchWalletData();
  }, [navigate]);

  useEffect(() => {
    // Cleanup polling intervals on unmount
    return () => {
      Object.values(recommendationPolling).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [recommendationPolling]);

  // Update useEffect for polling to use looser matching
  useEffect(() => {
    // Only start polling if we have a pending recommendation
    if (recommendations.length > 0 && recommendations.some(rec => rec.status === 'pending')) {
      console.log('Starting to poll for pending recommendations');
      
      const intervalId = setInterval(async () => {
        try {
          // Fetch all recommendations for the current user
          const serverRecs = await fetchUserRecommendations();
          
          if (!serverRecs.length) {
            console.log('No recommendations found on server');
            return;
          }
          
          // Update state with any found recommendations
          setRecommendations(prevRecs => {
            // Create a copy of the current recommendations
            const updatedRecs = [...prevRecs];
            let hasUpdates = false;
            
            // Log all the local recommendations for debugging
            console.log('Local recommendations before update:', updatedRecs);
            
            // For each local recommendation
            updatedRecs.forEach((localRec, localIndex) => {
              console.log(`Checking local recommendation ${localIndex}:`, localRec);
              
              // Look for any matching recommendations on server using multiple attributes
              const matchingServerRecs = serverRecs.filter(serverRec => {
                // Match by various identifiers
                const idMatch = localRec._id === serverRec._id;
                const tempIdMatch = 
                  localRec.tempId === serverRec.temp_id || 
                  localRec._id === serverRec.temp_id ||
                  (serverRec.temp_id && localRec.tempId && 
                   serverRec.temp_id.includes(localRec.tempId.substring(0, 8)));
                  
                // Match by data attributes
                const typeMatch = localRec.recommendationType === serverRec.recommendationType;
                const titleMatch = serverRec.eventData?.title === localRec.eventData?.title;
                
                // Checks if there's any kind of match
                const hasAnyMatch = idMatch || tempIdMatch || (typeMatch && titleMatch);
                
                console.log(`Server rec ${serverRec._id} comparison:`, { 
                  idMatch, tempIdMatch, typeMatch, titleMatch, hasAnyMatch
                });
                
                return hasAnyMatch;
              });
              
              // If we found any matches
              if (matchingServerRecs.length > 0) {
                console.log(`Found ${matchingServerRecs.length} matching server recommendations:`, matchingServerRecs);
                
                // Use the first match (most likely the right one)
                const serverRec = matchingServerRecs[0];
                
                // Check if the status changed
                if (localRec.status === 'pending' && serverRec.status === 'responded') {
                  console.log('Status changed from pending to responded:', serverRec);
                  hasUpdates = true;
                }
                
                // Update the local recommendation with server data but preserve temp ID
                updatedRecs[localIndex] = {
                  ...serverRec,
                  _id: serverRec._id, // Use server's MongoDB ID
                  tempId: localRec.tempId || serverRec.temp_id, // Preserve temp ID
                  recommendationType: localRec.recommendationType || serverRec.recommendationType
                };
              }
            });
            
            if (hasUpdates) {
              toast.success('Recommendation received!');
            }
            
            return updatedRecs;
          });
        } catch (error) {
          console.error('Error polling recommendations:', error);
        }
      }, 5000);
      
      return () => {
        console.log('Cleaning up polling interval');
        clearInterval(intervalId);
      };
    }
  }, [recommendations, userId]);

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

  const handleRequestRecommendation = async (type = 'location') => {
    // Check if the user has enough coins
    if (wallet.coins < RECOMMENDATION_COST) {
      toast.error('Insufficient coins. Please top up your wallet.');
      return;
    }

    try {
      // Create a temporary ID for tracking
      const tempId = uuidv4();
      
      // Set recommendation type based on button clicked
      let recommendationType = type;
      
      // Get recommendation text based on type
      const recommendationText = getRecommendationText(type);
      
      // Prepare the event data to send
      const eventDataToSend = {
        temp_id: tempId,
        title: formData.name,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        location: {
          venue: formData.venue,
          address: formData.address
        },
        price: formData.price,
        availableTickets: formData.available_tickets,
        organizerId: userId,
        recommendationType: recommendationType,
        recommendationText: recommendationText
      };
      
      console.log('Requesting recommendation with data:', eventDataToSend);
      setRecommendationLoading(true);
      
      // Make the API call
      const response = await recommendationApi.requestRecommendation(eventDataToSend);
      
      console.log('Recommendation request response:', response.data);
      
      // Update wallet balance if applicable
      if (response.data.wallet) {
        setWallet(response.data.wallet);
      }
      
      // Extract the MongoDB ID from the response
      const mongoId = response.data.recommendation?._id || '';
      console.log('MongoDB ID received:', mongoId);
      
      // Store the recommendation in state with a pending status
      const newRecommendation = {
        _id: mongoId,
        tempId: tempId,
        status: 'pending',
        recommendationType: recommendationType,
        eventData: eventDataToSend
      };
      
      console.log('Adding new recommendation to state:', newRecommendation);
      setRecommendations(prev => [...prev, newRecommendation]);
      
      // Immediately trigger a refresh to find our newly created recommendation
      setTimeout(() => {
        refreshRecommendations();
      }, 1000);
      
      toast.success('Recommendation request submitted!');
    } catch (error) {
      console.error('Error requesting recommendation:', error);
      toast.error('Failed to submit recommendation request.');
    } finally {
      setRecommendationLoading(false);
    }
  };

  // Helper function to get recommendation text based on type
  const getRecommendationText = (type) => {
    switch (type) {
      case 'location':
        return 'Please provide recommendations for the location of my event.';
      case 'venue':
        return 'Please suggest a good venue for my event.';
      case 'tickets':
        return 'How many tickets should I make available for this event?';
      default:
        return 'Please provide recommendations for my event.';
    }
  };
  
  // Helper function to update form data with recommendation (we'll keep this but not use it automatically)
  const updateFormWithRecommendation = (type, recommendation) => {
    if (type === 'location') {
      setFormData(prev => ({
        ...prev,
        location: recommendation.responseText
      }));
    } else if (type === 'venue') {
      setFormData(prev => ({
        ...prev,
        venue: recommendation.responseText
      }));
    } else if (type === 'tickets') {
      // Parse the recommendation for tickets/price
      try {
        const ticketData = JSON.parse(recommendation.responseText);
        setFormData(prev => ({
          ...prev,
          available_tickets: ticketData.tickets || prev.available_tickets,
          price: ticketData.price || prev.price
        }));
      } catch (e) {
        console.error('Error parsing ticket recommendation:', e);
        setFormData(prev => ({
          ...prev,
          available_tickets: recommendation.responseText
        }));
      }
    }

    toast.success(`Received ${type} recommendation from admin!`);
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

      // Clear any ongoing recommendation polling
      Object.entries(recommendationPolling).forEach(([type, interval]) => {
        if (interval) {
          clearInterval(interval);
          setRecommendationPolling(prev => ({
            ...prev,
            [type]: null
          }));
        }
      });

      toast.success('Event created successfully!');
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
              <div>
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

            {/* Show pending or responded location recommendation */}
            {recommendations.some(rec => rec.recommendationType === 'location') && (
              <div className="mt-3 p-3 rounded-md border" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Admin Recommendation:</p>
                  <div className="flex items-center">
                    <button 
                      onClick={() => refreshRecommendations()} 
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center mr-2"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    {recommendations.some(rec => rec.recommendationType === 'location' && rec.status === 'pending') && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Waiting...
                      </span>
                    )}
                    {recommendations.some(rec => rec.recommendationType === 'location' && rec.status === 'responded') && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Received
                      </span>
                    )}
                  </div>
                </div>
                
                {recommendations.some(rec => rec.recommendationType === 'location' && rec.status === 'pending') && (
                  <p className="text-yellow-600 text-sm">Waiting for admin recommendation...</p>
                )}
                
                {recommendations.some(rec => rec.recommendationType === 'location' && rec.status === 'responded') && (
                  <div>
                    <p className="text-gray-800 p-2 bg-gray-50 rounded border border-gray-200">
                      {recommendations.find(rec => rec.recommendationType === 'location' && rec.status === 'responded').responseText}
                    </p>
                  <Button
                    type="button"
                    variant="outline"
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        location: recommendations.find(rec => rec.recommendationType === 'location' && rec.status === 'responded').responseText
                      }))}
                    >
                      Use This Recommendation
                  </Button>
                </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRequestRecommendation('location')}
                disabled={recommendationLoading || !wallet || wallet.coins < 10 || recommendations.some(rec => rec.recommendationType === 'location' && rec.status === 'pending')}
              >
                {recommendations.some(rec => rec.recommendationType === 'location' && rec.status === 'pending') ? 'Waiting...' : 'Get Location Recommendation (10 coins)'}
              </Button>
              </div>

              <div>
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

            {/* Show pending or responded venue recommendation */}
            {recommendations.some(rec => rec.recommendationType === 'venue') && (
              <div className="mt-3 p-3 rounded-md border" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Admin Recommendation:</p>
                  <div className="flex items-center">
                    <button 
                      onClick={() => refreshRecommendations()} 
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center mr-2"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    {recommendations.some(rec => rec.recommendationType === 'venue' && rec.status === 'pending') && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Waiting...
                      </span>
                    )}
                    {recommendations.some(rec => rec.recommendationType === 'venue' && rec.status === 'responded') && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Received
                      </span>
                    )}
                  </div>
                </div>
                
                {recommendations.some(rec => rec.recommendationType === 'venue' && rec.status === 'pending') && (
                  <p className="text-yellow-600 text-sm">Waiting for admin recommendation...</p>
                )}
                
                {recommendations.some(rec => rec.recommendationType === 'venue' && rec.status === 'responded') && (
                  <div>
                    <p className="text-gray-800 p-2 bg-gray-50 rounded border border-gray-200">
                      {recommendations.find(rec => rec.recommendationType === 'venue' && rec.status === 'responded').responseText}
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        venue: recommendations.find(rec => rec.recommendationType === 'venue' && rec.status === 'responded').responseText
                      }))}
                    >
                      Use This Recommendation
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRequestRecommendation('venue')}
                disabled={recommendationLoading || !wallet || wallet.coins < 10 || recommendations.some(rec => rec.recommendationType === 'venue' && rec.status === 'pending')}
              >
                {recommendations.some(rec => rec.recommendationType === 'venue' && rec.status === 'pending') ? 'Waiting...' : 'Get Venue Recommendation (10 coins)'}
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
              {recommendations.length > 0 && recommendations.some(rec => rec.recommendationType === 'tickets' && rec.status === 'responded') && (
                <div className="mt-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600 text-sm font-semibold">Admin Recommendation for Price:</p>
                    {(() => {
                      try {
                        const ticketData = JSON.parse(recommendations.find(rec => rec.recommendationType === 'tickets' && rec.status === 'responded').responseText);
                        return (
                          <p className="text-gray-800">₹{ticketData.price || 'No price recommendation'}</p>
                        );
                      } catch (e) {
                        return (
                          <p className="text-gray-800">See tickets recommendation</p>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div>
                <div>
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
              {/* Show pending or responded tickets recommendation */}
              {recommendations.some(rec => rec.recommendationType === 'tickets') && (
                <div className="mt-3 p-3 rounded-md border" style={{ borderColor: '#e2e8f0' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Admin Recommendation:</p>
                    <div className="flex items-center">
                      <button 
                        onClick={() => refreshRecommendations()} 
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center mr-2"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                      {recommendations.some(rec => rec.recommendationType === 'tickets' && rec.status === 'pending') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Waiting...
                        </span>
                      )}
                      {recommendations.some(rec => rec.recommendationType === 'tickets' && rec.status === 'responded') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Received
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {recommendations.some(rec => rec.recommendationType === 'tickets' && rec.status === 'pending') && (
                    <p className="text-yellow-600 text-sm">Waiting for admin recommendation...</p>
                  )}
                  
                  {recommendations.some(rec => rec.recommendationType === 'tickets' && rec.status === 'responded') && (
                    <div>
                      <p className="text-gray-800 p-2 bg-gray-50 rounded border border-gray-200">
                        {recommendations.find(rec => rec.recommendationType === 'tickets' && rec.status === 'responded').responseText}
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-xs"
                        onClick={() => {
                          try {
                            // Try to parse JSON if it's in JSON format
                            const responseText = recommendations.find(rec => rec.recommendationType === 'tickets' && rec.status === 'responded').responseText;
                            const ticketData = JSON.parse(responseText);
                            setFormData(prev => ({
                              ...prev,
                              available_tickets: ticketData.tickets || prev.available_tickets,
                              price: ticketData.price || prev.price
                            }));
                          } catch (e) {
                            // If not JSON, just use the text directly
                            setFormData(prev => ({
                              ...prev,
                              available_tickets: recommendations.find(rec => rec.recommendationType === 'tickets' && rec.status === 'responded').responseText
                            }));
                          }
                        }}
                      >
                        Use This Recommendation
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRequestRecommendation('tickets')}
                  disabled={recommendationLoading || !wallet || wallet.coins < 10 || recommendations.some(rec => rec.recommendationType === 'tickets' && rec.status === 'pending')}
                >
                  {recommendations.some(rec => rec.recommendationType === 'tickets' && rec.status === 'pending') ? 'Waiting...' : 'Get Tickets Recommendation (10 coins)'}
                </Button>
              </div>
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

  // Update fetchUserRecommendations to better match recommendations
  const fetchUserRecommendations = async () => {
    try {
      console.log('Fetching recommendations by organizer');
      
      // Get the pending recommendations from the backend
      const response = await api.get('/recommendations/pending');
      console.log('Pending recommendations:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const pendingRecs = response.data;
        
        // Log the actual userId to help with comparison
        console.log(`Current logged in userId: ${userId}, type: ${typeof userId}`);
        
        // Debug organizer IDs in recommendations
        if (pendingRecs.length > 0) {
          console.log('First recommendation organizerId:', pendingRecs[0].organizerId, 'type:', typeof pendingRecs[0].organizerId);
        }
        
        // Also check for any recommendations that match our temp ID
        const localTempIds = recommendations.map(rec => rec.tempId);
        console.log('Local recommendation tempIds to match:', localTempIds);
        
        // Filter to find recommendations for this organizer with more inclusive matching
        const userRecs = pendingRecs.filter(rec => {
          // Use explicit conversion for comparison to handle numeric vs string IDs
          const orgId = Number(rec.organizerId);
          const loggedInId = Number(userId);
          const matchesId = !isNaN(orgId) && !isNaN(loggedInId) && orgId === loggedInId;
          
          // Check if we have this recommendation in our local state by any ID
          const matchesLocalRec = recommendations.some(localRec => 
            localRec._id === rec._id || 
            localRec.tempId === rec.temp_id ||
            localTempIds.includes(rec.temp_id)
          );
          
          // Match by title if we have title matching
          const matchesTitle = recommendations.some(localRec => 
            localRec.eventData?.title === rec.eventData?.title
          );
          
          const shouldInclude = matchesId || matchesLocalRec || matchesTitle;
          
          console.log(`Checking rec: ${rec._id}, organizerId: ${rec.organizerId}, matches: ${shouldInclude} (ID match: ${matchesId}, local match: ${matchesLocalRec}, title match: ${matchesTitle})`);
          
          return shouldInclude;
        });
        
        console.log('User recommendations after filtering:', userRecs);
        
        return userRecs;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching recommendations by organizer:', error);
      return [];
    }
  };

  // Add this function to help with debugging recommendation matches
  const logRecommendationComparison = () => {
    console.log('--------- Recommendation Comparison ---------');
    console.log('Local recommendations:', recommendations);

    // For each local recommendation
    recommendations.forEach((rec, index) => {
      console.log(`Local recommendation #${index+1}:`);
      console.log(`- _id: ${rec._id}`);
      console.log(`- tempId: ${rec.tempId}`);
      console.log(`- type: ${rec.recommendationType}`);
      console.log(`- status: ${rec.status}`);
      
      // Check this against pending recommendations
      fetchUserRecommendations().then(pendingRecs => {
        console.log('Checking against server recommendations:');
        
        pendingRecs.forEach(serverRec => {
          const idMatch = rec._id === serverRec._id;
          const tempIdMatch = rec.tempId === serverRec.temp_id;
          const typeMatch = rec.recommendationType === serverRec.recommendationType;
          
          if (idMatch || tempIdMatch || typeMatch) {
            console.log('Found potential matching server recommendation:');
            console.log(`- _id: ${serverRec._id} (match: ${idMatch})`);
            console.log(`- temp_id: ${serverRec.temp_id} (match: ${tempIdMatch})`);
            console.log(`- type: ${serverRec.recommendationType} (match: ${typeMatch})`);
            console.log(`- status: ${serverRec.status}`);
          }
        });
      });
    });
    console.log('-------------------------------------------');
  };

  // Add to the refreshRecommendations function
  const refreshRecommendations = async () => {
    try {
      console.log('Manually refreshing recommendations');
      
      // First log detailed comparison for debugging
      logRecommendationComparison();
      
      // Continue with existing code...
      
      // Fetch all recommendations for the current user
      const serverRecs = await fetchUserRecommendations();
      
      if (!serverRecs.length) {
        console.log('No recommendations found on server');
        toast('No recommendations found on server');
        return;
      }
      
      // Update state with any found recommendations
      setRecommendations(prevRecs => {
        // Create a copy of the current recommendations
        const updatedRecs = [...prevRecs];
        let hasUpdates = false;
        
        // For each server recommendation, try to match it with local ones
        for (const serverRec of serverRecs) {
          // Try to find a matching recommendation in our local state
          const localIndex = updatedRecs.findIndex(rec => 
            // Match by type, temp_id, or _id
            (rec.recommendationType === serverRec.recommendationType && 
             rec.status === 'pending' && serverRec.status === 'responded') ||
            rec._id === serverRec._id || 
            rec.tempId === serverRec.temp_id
          );
          
          if (localIndex >= 0) {
            // We found a matching recommendation
            console.log('Found matching recommendation:', serverRec);
            
            // Check if the status changed
            if (updatedRecs[localIndex].status === 'pending' && serverRec.status === 'responded') {
              hasUpdates = true;
            }
            
            // Update the local recommendation
            updatedRecs[localIndex] = {
              ...serverRec,
              _id: serverRec._id,
              tempId: updatedRecs[localIndex].tempId || serverRec.temp_id,
              recommendationType: updatedRecs[localIndex].recommendationType || serverRec.recommendationType
            };
          }
        }
        
        if (hasUpdates) {
          toast.success('New recommendation updates found!');
        } else {
          toast('No new updates found');
        }
        
        return updatedRecs;
      });
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      toast.error('Failed to refresh recommendations');
    }
  };

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
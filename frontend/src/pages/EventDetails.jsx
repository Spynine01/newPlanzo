import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { eventApi } from '../services/api';
import RazorpayPayment from '../components/Payment/RazorpayPayment';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch event details
        const response = await eventApi.getEvent(id);
        setEvent(response.data);
        
        // Only fetch recommendations if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const recommendationsResponse = await eventApi.getEventRecommendations(id);
            setRecommendations(recommendationsResponse.data);
          } catch (recError) {
            console.error('Error fetching recommendations:', recError);
            // Don't set error state for recommendations failure
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleTicketQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value < 1) {
        setTicketQuantity(1);
      } else if (value > event.available_tickets) {
        setTicketQuantity(event.available_tickets);
      } else {
        setTicketQuantity(value);
      }
    }
  };

  const handlePaymentSuccess = async (response) => {
    console.log('Payment successful:', response);
    try {
      // Refresh event details
      const eventResponse = await eventApi.getEvent(id);
      setEvent(eventResponse.data);
      
      // Show success message
      setError(null);
      alert('Ticket purchased successfully! Check your email for details.');
    } catch (error) {
      console.error('Error refreshing event details:', error);
      setError('Payment was successful but failed to refresh event details. Please reload the page.');
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setError(typeof error === 'string' ? error : 'Payment failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/events')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Event not found</p>
          <Button onClick={() => navigate('/events')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Event Image */}
                  {event.image_url && (
                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                      <img
                        src={`http://127.0.0.1:8000${event.image_url}`}
                        alt={event.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                  )}

                  {/* Event Title and Basic Info */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                    <p className="mt-2 text-gray-600">{event.description}</p>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-sm font-medium text-gray-500">Date & Time</h2>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500">Category</h2>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {event.category}
                      </p>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500">Location</h2>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </p>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500">Venue</h2>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {event.venue}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <h2 className="text-sm font-medium text-gray-500">Address</h2>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {event.address}
                      </p>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500">Available Tickets</h2>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        {event.available_tickets}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Expert Recommendations</h2>
                      <div className="space-y-4">
                        {recommendations.map((rec) => (
                          rec.status === 'approved' && (
                            <div key={rec.id} className="bg-blue-50 p-4 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  {rec.type === 'category' && (
                                    <svg className="h-6 w-6 text-blue-600" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  )}
                                  {rec.type === 'location' && (
                                    <svg className="h-6 w-6 text-blue-600" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  )}
                                  {rec.type === 'pricing' && (
                                    <svg className="h-6 w-6 text-blue-600" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-gray-900">{rec.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Card */}
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">₹{event.price.toLocaleString('en-IN')}</h3>
                    <p className="text-sm text-gray-500">per ticket</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Tickets
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTicketQuantityChange({ target: { value: ticketQuantity - 1 } })}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                        disabled={ticketQuantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={event.available_tickets}
                        value={ticketQuantity}
                        onChange={handleTicketQuantityChange}
                        className="block w-20 px-3 py-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleTicketQuantityChange({ target: { value: ticketQuantity + 1 } })}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                        disabled={ticketQuantity >= event.available_tickets}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{(event.price * ticketQuantity).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {!localStorage.getItem('token') ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">Please log in to purchase tickets</p>
                      <Button 
                        onClick={() => navigate('/login')}
                        className="w-full"
                      >
                        Login to Continue
                      </Button>
                    </div>
                  ) : (
                    <RazorpayPayment
                      amount={(event.price * ticketQuantity) * 100}
                      onSuccess={handlePaymentSuccess}
                      onFailure={handlePaymentFailure}
                      type="ticket"
                      event_id={event.id}
                      quantity={ticketQuantity}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
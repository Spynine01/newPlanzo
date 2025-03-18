import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { eventApi } from '../services/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventApi.getEvent(id);
        setEvent(response.data);
      } catch (error) {
        console.error('Error fetching event:', error);
        // Handle error (e.g., show error message, redirect to 404)
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

  const handlePurchase = () => {
    if (ticketQuantity > event.available_tickets) {
      alert(`Sorry, only ${event.available_tickets} tickets are available.`);
      setTicketQuantity(event.available_tickets);
      return;
    }
    // TODO: Implement ticket purchase logic
    console.log(`Purchasing ${ticketQuantity} tickets for event ${id}`);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
        </button>

        {/* Event Image */}
        <div className="rounded-lg overflow-hidden mb-8">
          <img
            src={`http://127.0.0.1:8000${event.image_url}`}
            alt={event.name}
            className="w-full h-[400px] object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-event.jpg'; // Fallback image
              e.target.onerror = null; // Prevent infinite loop
            }}
          />
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {event.date} at {event.time}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
                    <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                  </div>

                  {/* Schedule - Only show if schedule exists */}
                  {event.schedule && Array.isArray(event.schedule) && event.schedule.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">Event Schedule</h2>
                      <div className="space-y-3">
                        {event.schedule.map((item, index) => (
                          <div key={index} className="flex items-start">
                            <span className="font-medium text-gray-900 w-24">{item.time}</span>
                            <span className="text-gray-600">{item.activity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Venue */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Venue Information</h2>
                    <p className="text-gray-600">
                      {event.venue}<br />
                      {event.address}
                    </p>
                  </div>

                  {/* Organizer - Only show if organizer exists */}
                  {event.organizer && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">Event Organizer</h2>
                      <div className="text-gray-600">
                        <p className="font-medium">{event.organizer.name}</p>
                        <p>{event.organizer.email}</p>
                        <p>{event.organizer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Purchase Sidebar */}
          <div className="md:col-span-1">
            <Card className="sticky top-8">
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
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
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
                    <p className="mt-2 text-sm text-gray-500">
                      {event.available_tickets} tickets available
                    </p>
                  </div>

                  <div>
                    <p className="flex justify-between text-lg font-medium text-gray-900 mb-4">
                      <span>Total</span>
                      <span>₹{(event.price * ticketQuantity).toLocaleString('en-IN')}</span>
                    </p>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handlePurchase}
                      disabled={ticketQuantity < 1 || ticketQuantity > event.available_tickets}
                    >
                      Purchase Tickets
                    </Button>
                  </div>
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
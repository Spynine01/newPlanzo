import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { adminApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [response, setResponse] = useState('');

  // Check admin authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('user_role');
    if (!token || userRole !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch recommendations initially and every 30 seconds
  useEffect(() => {
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log('Fetching recommendations...');
      const response = await adminApi.getRecommendations();
      console.log('Raw admin recommendations response:', response);

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const recommendationsData = response.data.recommendations || [];
      console.log('Processed recommendations data:', recommendationsData);

      if (!Array.isArray(recommendationsData)) {
        throw new Error('Recommendations data is not an array');
      }

      // Sort recommendations by creation date (newest first)
      const sortedRecommendations = [...recommendationsData].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setRecommendations(sortedRecommendations);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load recommendations: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (e) => {
    e.preventDefault();
    if (!selectedRecommendation || !response.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Update the recommendation
      await adminApi.respondToRecommendation(selectedRecommendation.id, {
        status: 'approved',
        admin_notes: response.trim(),
        recommendation: response.trim()
      });

      // Update the pending event with the recommended value
      await adminApi.updatePendingEvent(selectedRecommendation.event_id, {
        [selectedRecommendation.type]: response.trim()
      });

      toast.success('Recommendation approved successfully');
      
      // Check if this was the last pending recommendation for this event
      const eventRecommendations = recommendations.filter(
        rec => rec.event_id === selectedRecommendation.event_id
      );
      
      const remainingPending = eventRecommendations.filter(
        rec => rec.id !== selectedRecommendation.id && rec.status === 'pending'
      );

      if (remainingPending.length === 0) {
        // All recommendations are approved, finalize the event
        await adminApi.finalizePendingEvent(selectedRecommendation.event_id);
        toast.success('Event finalized and published!');
      }
      
      // Refresh recommendations
      await fetchRecommendations();
      
      setSelectedRecommendation(null);
      setResponse('');
    } catch (err) {
      console.error('Error responding to recommendation:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit response');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendationType = (type) => {
    switch (type?.toLowerCase()) {
      case 'location':
        return 'Location Recommendation';
      case 'venue':
        return 'Venue Recommendation';
      case 'tickets':
        return 'Available Tickets Recommendation';
      case 'category':
        return 'Category Recommendation';
      case 'pricing':
        return 'Pricing Recommendation';
      default:
        return type ? type.charAt(0).toUpperCase() + type.slice(1) + ' Recommendation' : 'Unknown Type';
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading recommendations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage event recommendations and platform settings</p>
          <Button
            variant="outline"
            onClick={fetchRecommendations}
            className="mt-4"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Recommendations'}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-semibold">
                Pending Recommendations ({recommendations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading && recommendations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Loading recommendations...
                </p>
              ) : recommendations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No pending recommendations
                </p>
              ) : (
                <div className="space-y-6">
                  {recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-grow space-y-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {getRecommendationType(recommendation.type)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Event: {recommendation.event?.name || 'Unknown Event'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatDate(recommendation.created_at)}
                            </p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-md">
                            <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Description:</strong> {recommendation.event?.description || 'No description'}
                            </p>
                            {recommendation.type === 'location' && (
                              <p className="text-sm text-gray-600">
                                <strong>Current Location:</strong> {recommendation.event?.location || 'Not set'}
                              </p>
                            )}
                            {recommendation.type === 'venue' && (
                              <p className="text-sm text-gray-600">
                                <strong>Current Venue:</strong> {recommendation.event?.venue || 'Not set'}
                              </p>
                            )}
                            {recommendation.type === 'tickets' && (
                              <p className="text-sm text-gray-600">
                                <strong>Current Tickets:</strong> {recommendation.event?.available_tickets || '0'}
                              </p>
                            )}
                            {recommendation.type === 'category' && (
                              <p className="text-sm text-gray-600">
                                <strong>Current Category:</strong> {recommendation.event?.category || 'Not set'}
                              </p>
                            )}
                            {recommendation.type === 'pricing' && (
                              <p className="text-sm text-gray-600">
                                <strong>Current Price:</strong> ₹{recommendation.event?.price || '0'}
                              </p>
                            )}
                          </div>

                          <div className="bg-blue-50 p-4 rounded-md">
                            <h4 className="font-medium text-blue-900 mb-2">Recommendation</h4>
                            <p className="text-sm text-blue-800">{recommendation.recommendation}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setSelectedRecommendation(recommendation)}
                          className="ml-4 bg-blue-500 text-white hover:bg-blue-600"
                        >
                          Respond
                        </Button>
                      </div>

                      {selectedRecommendation?.id === recommendation.id && (
                        <form onSubmit={handleResponse} className="mt-6 space-y-4 border-t border-gray-200 pt-4">
                          <div>
                            <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                              Your Response
                            </label>
                            <Input
                              id="response"
                              type="text"
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              placeholder="Enter your recommendation response"
                              required
                              className="w-full"
                            />
                          </div>
                          <div className="flex gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecommendation(null);
                                setResponse('');
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                              disabled={loading}
                            >
                              {loading ? 'Submitting...' : 'Submit Response'}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
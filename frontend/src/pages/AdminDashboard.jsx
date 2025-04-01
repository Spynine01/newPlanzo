import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { adminApi } from '../services/api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await adminApi.getRecommendations();
      setRecommendations(response.data);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    }
  };

  const handleResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.error('Please enter a response.');
      return;
    }

    setSubmitting(true);
    try {
      // Get the ID from the selected recommendation (either _id or temp_id)
      const recommendationId = selectedRecommendation._id || selectedRecommendation.temp_id;
      console.log(`Responding to recommendation with ID: ${recommendationId}`);
      
      const response = await adminApi.respondToRecommendation(
        recommendationId,
        responseText
      );

      console.log('Response submitted successfully:', response.data);

      // Update the recommendations list
      setRecommendations(prevRecommendations =>
        prevRecommendations.filter(rec => 
          rec._id !== selectedRecommendation._id && 
          rec.temp_id !== selectedRecommendation.temp_id
        )
      );
      setSelectedRecommendation(null);
      setResponseText('');
      toast.success('Response submitted successfully.');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error(
        error.response?.data?.message || 'Failed to submit response.'
      );
    } finally {
      setSubmitting(false);
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
    switch (type) {
      case 'category':
        return 'Category Recommendation';
      case 'location':
        return 'Location Recommendation';
      case 'pricing':
        return 'Pricing Recommendation';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage event recommendations and platform settings</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending recommendations</p>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((recommendation) => (
                    <div
                      key={recommendation._id}
                      className={`p-4 bg-white rounded-lg border ${
                        selectedRecommendation?._id === recommendation._id
                          ? 'border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {getRecommendationType(recommendation.recommendationType)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Organizer ID: {recommendation.organizerId}
                          </p>
                          <p className="text-sm text-gray-500">
                            Event: {recommendation.eventData?.title || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Request: {recommendation.recommendationText}
                          </p>
                          <p className="text-sm text-gray-500">
                            Requested at: {formatDate(recommendation.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedRecommendation(recommendation)}
                          className="ml-4"
                        >
                          Respond
                        </Button>
                      </div>

                      {selectedRecommendation?._id === recommendation._id && (
                        <form onSubmit={handleResponse} className="mt-4 space-y-4">
                          <Input
                            type="text"
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Enter your recommendation"
                            required
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecommendation(null);
                                setResponseText('');
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="primary"
                              className="flex-1"
                              disabled={submitting}
                            >
                              {submitting ? 'Submitting...' : 'Submit Response'}
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
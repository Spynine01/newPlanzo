import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { adminApi } from '../services/api';

const AdminDashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [response, setResponse] = useState('');

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
    if (!selectedRecommendation || !response.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await adminApi.respondToRecommendation(selectedRecommendation.id, response.trim());

      setRecommendations(prev => 
        prev.filter(rec => rec.id !== selectedRecommendation.id)
      );
      setSelectedRecommendation(null);
      setResponse('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response');
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
                      key={recommendation.id}
                      className={`p-4 bg-white rounded-lg border ${
                        selectedRecommendation?.id === recommendation.id
                          ? 'border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {getRecommendationType(recommendation.type)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Event: {recommendation.event.name}
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

                      {selectedRecommendation?.id === recommendation.id && (
                        <form onSubmit={handleResponse} className="mt-4 space-y-4">
                          <Input
                            type="text"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Enter your recommendation"
                            required
                          />
                          <div className="flex gap-2">
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
                              variant="primary"
                              className="flex-1"
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
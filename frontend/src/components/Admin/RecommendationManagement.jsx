import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RecommendationManagement = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPendingRecommendations();
    }, []);

    const fetchPendingRecommendations = async () => {
        try {
            const response = await axios.get('/api/recommendations/pending');
            setRecommendations(response.data);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            toast.error('Failed to fetch recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResponseSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRecommendation || !responseText.trim()) return;

        try {
            await axios.post('/api/recommendations/respond', {
                recommendationId: selectedRecommendation._id,
                responseText
            });

            toast.success('Response submitted successfully');
            setResponseText('');
            setSelectedRecommendation(null);
            fetchPendingRecommendations();
        } catch (error) {
            console.error('Error submitting response:', error);
            toast.error('Failed to submit response');
        }
    };

    if (isLoading) {
        return <div className="text-center py-4">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Recommendation Requests</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List of pending recommendations */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
                    <div className="space-y-4">
                        {recommendations.map((rec) => (
                            <div
                                key={rec._id}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    selectedRecommendation?._id === rec._id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'hover:border-blue-300'
                                }`}
                                onClick={() => {
                                    setSelectedRecommendation(rec);
                                    setResponseText('');
                                }}
                            >
                                <div className="font-medium">
                                    Organizer: {rec.organizerId}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Event: {rec.eventData.title}
                                </div>
                                <div className="text-sm text-gray-600 mt-2">
                                    Request: {rec.recommendationText}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Response form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Submit Response</h2>
                    {selectedRecommendation ? (
                        <form onSubmit={handleResponseSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Your Recommendations
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="6"
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Enter your recommendations for the event..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Submit Response
                            </button>
                        </form>
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            Select a recommendation request to respond
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecommendationManagement; 
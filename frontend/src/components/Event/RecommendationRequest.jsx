import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RecommendationRequest = ({ eventData, onRecommendationReceived }) => {
    const [recommendationText, setRecommendationText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recommendationId, setRecommendationId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/api/recommendations/request', {
                eventData,
                recommendationText
            });

            setRecommendationId(response.data.recommendation._id);
            toast.success('Recommendation request submitted successfully');
            
            // Start polling for admin response
            pollForResponse(response.data.recommendation._id);
        } catch (error) {
            console.error('Error submitting recommendation request:', error);
            toast.error('Failed to submit recommendation request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const pollForResponse = async (id) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(`/api/recommendations/${id}`);
                const recommendation = response.data;

                if (recommendation.status === 'responded') {
                    clearInterval(pollInterval);
                    onRecommendationReceived(recommendation);
                    toast.success('Admin has provided recommendations');
                }
            } catch (error) {
                console.error('Error polling for recommendation:', error);
                clearInterval(pollInterval);
            }
        }, 5000); // Poll every 5 seconds

        // Stop polling after 5 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            toast.info('Recommendation request timed out. Please try again.');
        }, 300000);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Request Event Recommendations</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        What kind of recommendations are you looking for?
                    </label>
                    <textarea
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        value={recommendationText}
                        onChange={(e) => setRecommendationText(e.target.value)}
                        placeholder="E.g., Suggestions for pricing, venue improvements, marketing strategies, etc."
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
};

export default RecommendationRequest; 
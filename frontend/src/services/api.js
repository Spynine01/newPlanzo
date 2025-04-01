import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        // Handle organizer pending approval
        if (error.response && error.response.status === 403 && 
            error.response.data && error.response.data.message &&
            error.response.data.message.includes('pending')) {
            // We'll let the components handle this specific error with their own UI
        }
        return Promise.reject(error);
    }
);

export const eventApi = {
    // Get all events with optional search params
    getEvents: (params) => api.get('/events', { params }),

    // Get a single event by ID
    getEvent: (id) => api.get(`/events/${id}`),

    // Get event recommendations
    getEventRecommendations: (id) => api.get(`/events/${id}/recommendations`),

    // Create a new event
    createEvent: (formData) => {
        return api.post('/events', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Update an event
    updateEvent: (id, formData) => {
        return api.post(`/events/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Delete an event
    deleteEvent: (id) => api.delete(`/events/${id}`)
};

export const walletApi = {
    // Get wallet details
    getWallet: () => api.get('/wallet'),

    // Get wallet transactions
    getTransactions: () => api.get('/wallet/transactions'),

    // Request recommendation
    requestRecommendation: (data) => api.post('/wallet/request-recommendation', data),

    // Create payment order
    createOrder: (data) => api.post('/create-order', data),

    // Verify payment
    verifyPayment: (data) => api.post('/verify-payment', data)
};

export const adminApi = {
    // Get pending recommendations
    getRecommendations: () => api.get('/recommendations/pending'),

    // Respond to a recommendation
    respondToRecommendation: (id, responseText) => 
        api.post('/recommendations/respond', { 
            recommendationId: id, 
            responseText 
        })
};

// Add recommendation-specific API object
export const recommendationApi = {
    // Request a new recommendation
    requestRecommendation: (eventData) => api.post('/recommendations/request', eventData),
    
    // Get a specific recommendation with enhanced error handling
    getRecommendation: (id) => {
        console.log(`API call to get recommendation with ID: ${id}`);
        // Make sure we don't try to fetch with an invalid ID
        if (!id) {
            console.error('Attempted to fetch recommendation with null/undefined ID');
            return Promise.reject(new Error('Invalid recommendation ID'));
        }
        return api.get(`/recommendations/${id}`)
            .catch(error => {
                console.error(`Error fetching recommendation ${id}:`, error);
                throw error; // Re-throw to let caller handle it
            });
    },
    
    // Get all recommendations for the current user
    getUserRecommendations: () => api.get('/recommendations/my-recommendations'),
    
    // Create event from recommendation
    createEventFromRecommendation: (recommendationId, eventData) => 
        api.post(`/recommendations/create-event`, { recommendationId, eventData }),

    // Get recommendation by temp_id
    getRecommendationByTempId: (tempId) => api.get(`/recommendations/by-temp-id/${tempId}`)
};

export default api; 
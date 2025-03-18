import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Accept': 'application/json',
    }
});

// Add request interceptor to add auth token if it exists
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

export const eventApi = {
    // Get all events with optional search params
    getEvents: (params) => api.get('/events', { params }),

    // Get a single event by ID
    getEvent: (id) => api.get(`/events/${id}`),

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

    // Top up wallet
    topUp: (amount) => api.post('/wallet/top-up', { amount })
};

export const adminApi = {
    // Get pending recommendations
    getRecommendations: () => api.get('/admin/recommendations'),

    // Respond to a recommendation
    respondToRecommendation: (id, response) => 
        api.post(`/admin/recommendations/${id}/respond`, { response })
};

export default api; 
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
            // Only redirect to login if not already on login page
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
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
    deleteEvent: (id) => api.delete(`/events/${id}`),

    createPendingEvent: async (eventData) => {
        const formData = new FormData();
        
        // Add all fields to FormData
        Object.keys(eventData).forEach(key => {
            if (key === 'image' && eventData[key] instanceof File) {
                formData.append(key, eventData[key]);
            } else if (eventData[key] !== null && eventData[key] !== undefined && eventData[key] !== '') {
                // Convert numeric fields to numbers
                if (key === 'price' || key === 'available_tickets') {
                    formData.append(key, Number(eventData[key]));
                } else {
                    formData.append(key, eventData[key]);
                }
            }
        });

        formData.append('status', 'pending');
        
        const response = await api.post('/pending-events', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    },

    getPendingEvent: async (id) => {
        const response = await api.get(`/pending-events/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    },

    updatePendingEvent: async (id, eventData) => {
        const response = await api.put(`/pending-events/${id}`, eventData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    },

    finalizePendingEvent: async (id, eventData) => {
        const response = await api.post(`/pending-events/${id}/finalize`, eventData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    }
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
    getRecommendations: async () => {
        const response = await api.get('/admin/recommendations', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Cache-Control': 'no-cache'
            }
        });
        return response;
    },

    // Respond to a recommendation
    respondToRecommendation: async (recommendationId, data) => {
        const response = await api.put(`/admin/recommendations/${recommendationId}`, data, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    },

    updateEvent: (eventId, data) => {
        const token = localStorage.getItem('token');
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }
        
        return api.put(`/events/${eventId}`, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    },

    updatePendingEvent: async (eventId, eventData) => {
        const response = await api.put(`/admin/pending-events/${eventId}`, eventData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    },

    finalizePendingEvent: async (eventId) => {
        const response = await api.post(`/admin/pending-events/${eventId}/finalize`, {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    }
};

export default api; 
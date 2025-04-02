import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import api, { adminApi, recommendationApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaUsers, FaCalendarAlt, FaUserCheck, FaComment, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    pendingOrganizers: 0,
    pendingRecommendations: 0,
    totalRevenue: 0
  });
  
  // State for different sections
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingRecommendations, setPendingRecommendations] = useState([]);
  const [users, setUsers] = useState([]);
  
  // State for recommendation response
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (userRole !== 'admin') {
      navigate('/unauthorized');
      return;
    }

    fetchData();
  }, [navigate, userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await api.get('/admin/stats');
      setStats(statsResponse.data);

      // Fetch data based on active tab
      if (activeTab === 'organizers') {
        fetchPendingOrganizers();
      } else if (activeTab === 'events') {
        fetchEvents();
      } else if (activeTab === 'recommendations') {
    fetchRecommendations();
      } else if (activeTab === 'users') {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrganizers = async () => {
    try {
      const response = await api.get('/admin/organizers/pending');
      setPendingOrganizers(response.data || []);
    } catch (error) {
      console.error('Error fetching pending organizers:', error);
      toast.error('Failed to load pending organizers');
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/admin/events');
      console.log('Fetched events:', response.data);
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await adminApi.getRecommendations();
      setPendingRecommendations(response.data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedRecommendation(null);
    setResponseText('');
    
    // Fetch data based on the active tab
    if (tab === 'organizers') {
      fetchPendingOrganizers();
    } else if (tab === 'events') {
      fetchEvents();
    } else if (tab === 'recommendations') {
      fetchRecommendations();
    } else if (tab === 'users') {
      fetchUsers();
    }
  };

  const approveOrganizer = async (id) => {
    try {
      await api.put(`/admin/organizers/${id}/approve`);
      toast.success('Organizer approved successfully');
      fetchPendingOrganizers();
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error approving organizer:', error);
      toast.error('Failed to approve organizer');
    }
  };

  const rejectOrganizer = async (id) => {
    try {
      await api.delete(`/admin/organizers/${id}`);
      toast.success('Organizer rejected successfully');
      fetchPendingOrganizers();
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error rejecting organizer:', error);
      toast.error('Failed to reject organizer');
    }
  };

  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/events/${id}`);
        toast.success('Event deleted successfully');
        fetchEvents();
        fetchData(); // Refresh stats
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleRecommendationResponse = async (e) => {
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
      setPendingRecommendations(prevRecommendations =>
        prevRecommendations.filter(rec => 
          rec._id !== selectedRecommendation._id && 
          rec.temp_id !== selectedRecommendation.temp_id
        )
      );
      setSelectedRecommendation(null);
      setResponseText('');
      toast.success('Response submitted successfully.');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error(
        error.response?.data?.message || 'Failed to submit response.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await api.delete(`/admin/users/${id}`);
        toast.success(response.data.message || 'User deleted successfully');
        fetchUsers();
        fetchData(); // Refresh stats
      } catch (error) {
        console.error('Error deleting user:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to delete user. Please try again.';
        toast.error(errorMessage);
      }
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
      case 'location':
        return 'Location Recommendation';
      case 'venue':
        return 'Venue Recommendation';
      case 'tickets':
        return 'Tickets Recommendation';
      default:
        return type;
    }
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'organizer':
        return 'Event Organizer';
      case 'event_organizer':
        return 'Event Organizer';
      case 'user':
        return 'User';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              className={`pb-4 px-1 ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
              onClick={() => handleTabChange('overview')}
            >
              Overview
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'organizers'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
              onClick={() => handleTabChange('organizers')}
            >
              Organizer Approval
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'events'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
              onClick={() => handleTabChange('events')}
            >
              Events Management
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'recommendations'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
              onClick={() => handleTabChange('recommendations')}
            >
              Recommendations
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
              onClick={() => handleTabChange('users')}
            >
              User Management
            </button>
          </nav>
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <FaUsers className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-3xl font-semibold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <FaCalendarAlt className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-medium text-gray-500">Total Events</p>
                      <p className="text-3xl font-semibold text-gray-900">{stats.totalEvents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <FaUserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-medium text-gray-500">Pending Organizers</p>
                      <p className="text-3xl font-semibold text-gray-900">{stats.pendingOrganizers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <FaComment className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-medium text-gray-500">Pending Recommendations</p>
                      <p className="text-3xl font-semibold text-gray-900">{stats.pendingRecommendations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <FaChartBar className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                      <p className="text-3xl font-semibold text-gray-900">₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    The total revenue generated from ticket sales and platform fees.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => handleTabChange('organizers')} 
                      className="w-full justify-start bg-yellow-500 hover:bg-yellow-600"
                    >
                      <FaUserCheck className="mr-2" /> Approve Organizers ({stats.pendingOrganizers})
                    </Button>
                    <Button 
                      onClick={() => handleTabChange('recommendations')} 
                      className="w-full justify-start bg-purple-500 hover:bg-purple-600"
                    >
                      <FaComment className="mr-2" /> Manage Recommendations ({stats.pendingRecommendations})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Organizer Approval */}
        {activeTab === 'organizers' && (
          <div>
            <Card className="bg-white shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Organizer Approval</h3>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-500"></div>
                  </div>
                ) : pendingOrganizers.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No pending organizer approvals</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDF</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingOrganizers.map((organizer) => (
                          <tr key={organizer.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{organizer.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{organizer.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(organizer.created_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {organizer.pdf && (
                                <a
                                  href={`http://127.0.0.1:8000/storage/pdfs/${organizer.pdf}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  View PDF
                                </a>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => approveOrganizer(organizer.id)}
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  Approve
                                </Button>
                                <Button 
                                  onClick={() => rejectOrganizer(organizer.id)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events Management */}
        {activeTab === 'events' && (
          <div>
            <Card className="bg-white shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Events Management</h3>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No events found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {events.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium">{event.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{event.organizer_name || event.organizer?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(event.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{event.location || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => navigate(`/events/${event.id}`)}
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                  View
                                </Button>
                                <Button 
                                  onClick={() => deleteEvent(event.id)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        {activeTab === 'recommendations' && (
          <div>
            <Card className="bg-white shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Recommendations</h3>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : pendingRecommendations.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No pending recommendations</p>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      {pendingRecommendations.map((recommendation) => (
                        <div
                          key={recommendation._id}
                          className={`p-4 mb-4 bg-white rounded-lg border ${
                            selectedRecommendation?._id === recommendation._id
                              ? 'border-blue-500 shadow-md'
                              : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                                {getRecommendationType(recommendation.recommendationType)}
                          </h3>
                          <p className="text-sm text-gray-500">
                                Organizer: {recommendation.organizerName || recommendation.organizerId || 'N/A'}
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
                              className="ml-4 bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          Respond
                        </Button>
                      </div>

                          {selectedRecommendation?._id === recommendation._id && (
                            <form onSubmit={handleRecommendationResponse} className="mt-4 space-y-4">
                          <Input
                            type="text"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Enter your recommendation"
                            required
                                className="w-full border-gray-300 focus:ring-purple-500 focus:border-purple-500"
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
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Management */}
        {activeTab === 'users' && (
          <div>
            <Card className="bg-white shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No users found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap capitalize">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'organizer' || user.role === 'event_organizer'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {getRoleDisplayName(user.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(user.created_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.role !== 'admin' && (
                                <Button 
                                  onClick={() => deleteUser(user.id)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 
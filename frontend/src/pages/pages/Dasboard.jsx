import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FaUsers, FaCalendarAlt, FaUserCheck, FaComment, FaChartBar } from 'react-icons/fa';

export default function Dasboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    pendingOrganizers: 0,
    pendingRecommendations: 0,
    totalRevenue: 0
  });
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingRecommendations, setPendingRecommendations] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/unauthorized');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await api.get('/admin/stats');
      setStats(statsResponse.data);

      // Fetch pending organizers if on that tab
      if (activeTab === 'organizers') {
        fetchPendingOrganizers();
      }

      // Fetch events if on that tab
      if (activeTab === 'events') {
        fetchEvents();
      }

      // Fetch recommendations if on that tab
      if (activeTab === 'recommendations') {
        fetchRecommendations();
      }

      // Fetch users if on that tab
      if (activeTab === 'users') {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrganizers = async () => {
    try {
      const response = await api.get('/admin/organizers/pending');
      
      // Check if we have organizers from the response
      if (response.data && Array.isArray(response.data)) {
        setPendingOrganizers(response.data);
      } else {
        setPendingOrganizers([]);
        console.error('Invalid organizer data format returned from API');
      }
    } catch (error) {
      console.error('Error fetching pending organizers:', error);
      setPendingOrganizers([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/admin/events');
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/admin/recommendations');
      setPendingRecommendations(response.data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
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
      fetchPendingOrganizers();
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error approving organizer:', error);
    }
  };

  const rejectOrganizer = async (id) => {
    try {
      await api.delete(`/admin/organizers/${id}`);
      fetchPendingOrganizers();
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error rejecting organizer:', error);
    }
  };

  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/events/${id}`);
        fetchEvents();
        fetchData(); // Refresh stats
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const goToRecommendations = () => {
    navigate('/admin');
  };

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
        fetchData(); // Refresh stats
      } catch (error) {
        console.error('Error deleting user:', error);
      }
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
                      <p className="text-3xl font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
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
                      onClick={goToRecommendations} 
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
                  <p>Loading organizers...</p>
                ) : pendingOrganizers.length === 0 ? (
                  <p className="text-gray-500">No pending organizer approvals</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingOrganizers.map((organizer) => (
                          <tr key={organizer.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{organizer.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{organizer.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(organizer.created_at).toLocaleDateString()}</td>
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
                  <p>Loading events...</p>
                ) : events.length === 0 ? (
                  <p className="text-gray-500">No events found</p>
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
                          <tr key={event.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{event.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{event.organizer?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(event.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{event.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => navigate(`/events/${event.id}`)}
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  View
                                </Button>
                                <Button 
                                  onClick={() => deleteEvent(event.id)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600"
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
                  <p>Loading recommendations...</p>
                ) : pendingRecommendations.length === 0 ? (
                  <p className="text-gray-500">No pending recommendations</p>
                ) : (
                  <div className="space-y-6">
                    <Button 
                      onClick={goToRecommendations}
                      className="bg-purple-500 hover:bg-purple-600 mb-4"
                    >
                      Go to Recommendations Dashboard
                    </Button>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingRecommendations.map((recommendation) => (
                            <tr key={recommendation.id}>
                              <td className="px-6 py-4 whitespace-nowrap">{recommendation.event?.name || 'Pending Event'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{recommendation.user?.name || 'Unknown'}</td>
                              <td className="px-6 py-4 whitespace-nowrap capitalize">{recommendation.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{new Date(recommendation.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  {recommendation.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                  <p>Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-gray-500">No users found</p>
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
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap capitalize">{user.is_admin ? 'Admin' : 'User'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {!user.is_admin && (
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
}
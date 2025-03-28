import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: '',
    preferences: {
      category: '',
      location: '',
      notifications: true
    }
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const isOrganizer = userData.role === 'organizer';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user');
      
      // Set up user data from response
      const user = response.data;
      setUserData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        preferences: {
          category: user.preferences?.category || '',
          location: user.preferences?.location || '',
          notifications: user.preferences?.notifications !== false
        }
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load your profile information');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const validatePersonalInfo = () => {
    const newErrors = {};
    
    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    
    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updatePersonalInfo = async () => {
    if (!validatePersonalInfo()) return;
    
    try {
      setLoading(true);
      const response = await api.put('/user/profile', {
        name: userData.name,
        email: userData.email
      });
      
      toast.success('Personal information updated successfully');
    } catch (error) {
      console.error('Failed to update personal info:', error);
      toast.error(error.response?.data?.message || 'Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!validatePassword()) return;
    
    try {
      setLoading(true);
      const response = await api.put('/user/password', {
        current_password: passwordData.current_password,
        password: passwordData.new_password,
        password_confirmation: passwordData.confirm_password
      });
      
      toast.success('Password updated successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    try {
      setLoading(true);
      const response = await api.put('/user/preferences', {
        preferences: userData.preferences
      });
      
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading && !userData.name) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{userData.name}</h2>
                <p className="text-sm text-gray-600">{userData.email}</p>
                <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {isOrganizer ? 'Event Organizer' : 'User'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('personal')}
              >
                Personal Information
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'password'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('password')}
              >
                Change Password
              </button>
              {!isOrganizer && (
                <button
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'preferences'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('preferences')}
                >
                  Preferences
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handlePersonalInfoChange}
                    className="mt-1"
                    error={errors.name}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <Input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handlePersonalInfoChange}
                    className="mt-1"
                    error={errors.email}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <Input
                    type="text"
                    value={isOrganizer ? 'Event Organizer' : 'User'}
                    className="mt-1 bg-gray-100"
                    disabled
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Account type cannot be changed after registration
                  </p>
                </div>

                <div className="pt-5">
                  <Button onClick={updatePersonalInfo} disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <Input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="mt-1"
                    error={errors.current_password}
                  />
                  {errors.current_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <Input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="mt-1"
                    error={errors.new_password}
                  />
                  {errors.new_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <Input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="mt-1"
                    error={errors.confirm_password}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                  )}
                </div>

                <div className="pt-5">
                  <Button onClick={updatePassword} disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && !isOrganizer && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Event Category</label>
                  <Select
                    name="category"
                    value={userData.preferences.category}
                    onChange={handlePreferencesChange}
                    className="mt-1"
                  >
                    <option value="">Select a category</option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Arts">Arts</option>
                    <option value="Food">Food</option>
                    <option value="Business">Business</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Location</label>
                  <Input
                    type="text"
                    name="location"
                    value={userData.preferences.location}
                    onChange={handlePreferencesChange}
                    className="mt-1"
                    placeholder="Enter your preferred location"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="notifications"
                    name="notifications"
                    type="checkbox"
                    checked={userData.preferences.notifications}
                    onChange={handlePreferencesChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                    Receive email notifications about new events and recommendations
                  </label>
                </div>

                <div className="pt-5">
                  <Button onClick={updatePreferences} disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Section - Only shown for regular users */}
        {!isOrganizer && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Events Attended</p>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Recommendations</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Coins Spent</p>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organizer Stats Section - Only shown for event organizers */}
        {isOrganizer && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Tickets Sold</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">₹0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile; 
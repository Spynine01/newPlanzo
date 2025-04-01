import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Events from './pages/Events';
import AddEvent from './pages/AddEvent';
import EventDetails from './pages/EventDetails';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Analytics from './pages/Analytics';
import Comment from './pages/Comment';
import Product from './pages/Product';
import ProductList from './pages/ProductList';
import Login from './pages/SignUp & Login/Login';
import Signup from './pages/SignUp & Login/Signup';
import EventOrgLogin from './pages/EventOrgLogin';
import EventOrgRegister from './pages/EventOrgRegister';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperPage from './pages/SuperPage';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

// Protected route component
const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return element;
};

// Landing page component to handle the root route
const LandingPage = () => {
  return null; // This will render the index.html from public folder
};

const App = () => {
  const { isAuthenticated, userRole, logout, loading } = useAuth();

  // Check if user is an event organizer
  const isEventOrganizer = userRole === 'organizer';
  // Check if user is an admin
  const isAdmin = userRole === 'admin';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Main Content */}
        <div className="flex-1">
          {/* Navigation - Only show on non-landing pages */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={
              <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex">
                      <Link to="/" className="flex items-center text-xl font-bold text-blue-600">
                        Planzo
                      </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        to="/events"
                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Browse Events
                      </Link>
                      
                      {isAuthenticated && isEventOrganizer && (
                        <Link
                          to="/events/add"
                          className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Create Event
                        </Link>
                      )}
                      
                      {isAuthenticated && (isEventOrganizer || isAdmin) && (
                        <Link
                          to="/wallet"
                          className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Wallet
                        </Link>
                      )}
                      
                      {isAuthenticated && isAdmin && (
                        <Link
                          to="/admin"
                          className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      
                      {isAuthenticated ? (
                        <div className="flex items-center space-x-4">
                          <Link
                            to="/profile"
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Logout
                          </button>
                        </div>
                      ) : (
                        <>
                          <Link
                            to="/login"
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Login
                          </Link>
                          <Link
                            to="/register"
                            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium"
                          >
                            Sign Up
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </nav>
            } />
          </Routes>

          {/* Routes */}
          <div className="p-6">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetails />} />
              
              {/* Protected routes */}
              <Route path="/events/add" element={
                <ProtectedRoute 
                  element={<AddEvent />} 
                  allowedRoles={['organizer', 'user']} 
                />
              } />
              
              <Route path="/wallet" element={
                <ProtectedRoute 
                  element={<Wallet />} 
                  allowedRoles={['organizer', 'admin']} 
                />
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute 
                  element={<AdminDashboard />} 
                  allowedRoles={['admin']} 
                />
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute 
                  element={<Profile />} 
                  allowedRoles={['organizer', 'user', 'admin']} 
                />
              } />
              
              {/* New Routes */}
              <Route path="/about" element={<About />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/comments" element={<Comment />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<Product />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/event-org/login" element={<EventOrgLogin />} />
              <Route path="/event-org/register" element={<EventOrgRegister />} />
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/super-admin" element={<SuperPage />} />
              
              {/* Redirect dashboard route to admin */}
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
              
              {/* Error Routes */}
              <Route path="/unauthorized" element={
                <div className="flex flex-col items-center justify-center min-h-screen">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
                  <p className="mb-4">You do not have permission to access this page.</p>
                  <Link to="/" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md">
                    Go Home
                  </Link>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App; 
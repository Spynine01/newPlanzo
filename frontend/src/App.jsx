import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Events from './pages/Events';
import AddEvent from './pages/AddEvent';
import EventDetails from './pages/EventDetails';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Analytics from './pages/Analytics';
import Comment from './pages/Comment';
import Dashboard from './pages/Dasboard';
import Product from './pages/Product';
import ProductList from './pages/ProductList';
import Login from './pages/SignUp & Login/Login';
import Signup from './pages/SignUp & Login/Signup';
import EventOrgLogin from './pages/EventOrgLogin';
import EventOrgRegister from './pages/EventOrgRegister';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperPage from './pages/SuperPage';
import { Sidebar } from './components/Sidebar';
import './components/Sidebar.css';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1">
          {/* Navigation */}
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
                  <Link
                    to="/events/add"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create Event
                  </Link>
                  <Link
                    to="/wallet"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Wallet
                  </Link>
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
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
                </div>
              </div>
            </div>
          </nav>

          {/* Routes */}
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Events />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/add" element={<AddEvent />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/admin" element={<AdminDashboard />} />
              
              {/* New Routes */}
              <Route path="/about" element={<About />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/comments" element={<Comment />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<Product />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/event-org/login" element={<EventOrgLogin />} />
              <Route path="/event-org/register" element={<EventOrgRegister />} />
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/super-admin" element={<SuperPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App; 
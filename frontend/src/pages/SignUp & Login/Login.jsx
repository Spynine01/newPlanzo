import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import './Login.css'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, userRole } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if user is already authenticated
    if (isAuthenticated) {
      // Redirect based on role or to default page
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/events');
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    // Check if we have a success message from registration
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the location state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
    setError('');
  
    try {
      const response = await api.post('/login', {
        email: formData.email,
        password: formData.password
      });
  
      // Use the login method from AuthContext instead of manually setting localStorage
      login(response.data.token, response.data.user, response.data.role);
  
      // Check if there's a redirect path stored in location state
      const redirectTo = location.state?.redirectTo || '/events';
      
      // Redirect based on user role or intended destination
      if (response.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Login error:', error.response);
      
      if (error.response?.status === 403) {
        setError('Your account is pending approval. Please wait for admin verification.');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0][0];
        setError(firstError);
      } else {
        setError('Login failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="container">
        <div className="drop">
          <div className="context">
            <h2>Sign In</h2>
            {success && (
              <div className="success-message" style={{ color: '#33aa33', marginBottom: '10px', fontSize: '0.9em' }}>
                {success}
              </div>
            )}
            {error && (
              <div className="error-message" style={{ color: '#ff3333', marginBottom: '10px', fontSize: '0.9em' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="input">
                <input 
                  type="email" 
                  name='email' 
                  placeholder='Email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="input">
                <input 
                  type="password" 
                  name='password' 
                  placeholder='Password'
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="input">
                <input 
                  type="submit" 
                  value={loading ? 'Signing in...' : 'Login'} 
                  disabled={loading}
                />
              </div>
            </form>
          </div>
        </div>
        <Link to="/forgot-password" className="btn">Forget Password</Link>
        <Link to="/register" className="btn signup">Sign Up</Link>
      </div>
    </div>
  )
}

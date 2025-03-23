import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Signup.css'
import api from '../../services/api'

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    preferences: ['General'] // Default preference
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
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
      const response = await api.post('/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        preferences: formData.preferences
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/events');
    } catch (error) {
      if (error.response?.data?.errors) {
        // Handle validation errors from the backend
        const firstError = Object.values(error.response.data.errors)[0][0];
        setError(firstError);
      } else {
        setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
            <h2>Sign Up</h2>
            {error && (
              <div className="error-message" style={{ color: '#ff3333', marginBottom: '10px', fontSize: '0.9em' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="input">
                <input 
                  type="text" 
                  name='name' 
                  placeholder='Full Name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
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
                  minLength={8}
                />
              </div>
              <div className="input">
                <input 
                  type="password" 
                  name='password_confirmation' 
                  placeholder='Confirm Password'
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="input">
                <input 
                  type="submit" 
                  value={loading ? 'Creating Account...' : 'Sign Up'} 
                  disabled={loading}
                />
              </div>
            </form>
          </div>
        </div>
        <Link to="/login" className="btn signup">Login</Link>
      </div>
    </div>
  )
}

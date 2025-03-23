<<<<<<< HEAD
import React from 'react'
import './Login.css'
import Signup from './Signup'


export default function Login() {
=======
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'
import api from '../../services/api'

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/events');
    } catch (error) {
      if (error.response?.data?.errors) {
        // Handle validation errors from the backend
        const firstError = Object.values(error.response.data.errors)[0][0];
        setError(firstError);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

>>>>>>> e2989bcc5e6114891a28c1bb0c450081ebec68bf
  return (
    <div>
      <div className="container">
        <div className="drop">
<<<<<<< HEAD
            <div className="context">
                <h2>Sign In</h2>
                <form>
                    <div className="input">
                        <input type="text" name='username' placeholder='Username' />
                    </div>
                    <div className="input">
                        <input type="password" name='password' placeholder='Password' />
                    </div>
                    <div className="input">
                        <input type="submit" value='Login' href="#" />
                    </div>
                </form>
            </div>
        </div>
        <a href="#" className="btn">Forget Password</a>
        <a href="./Signup.jsx" className="btn signup">Sign Up</a>
=======
          <div className="context">
            <h2>Sign In</h2>
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
>>>>>>> e2989bcc5e6114891a28c1bb0c450081ebec68bf
      </div>
    </div>
  )
}

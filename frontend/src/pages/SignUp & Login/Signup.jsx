import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';
import api from '../../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user', // adds a default role, so that it will not be undefined and show the user options as default
    preferences: [], // no preference so that the form shows the error
    pdf: null, // For event organizer
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

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      pdf: e.target.files[0] // Store file properly
    });
  };

  const handleCheckboxChange = (e) => {
    const value = e.target.value;
    setFormData((prevData) => {
      const updatedPreferences = prevData.preferences.includes(value)
        ? prevData.preferences.filter((pref) => pref !== value) // Remove if already selected
        : [...prevData.preferences, value]; // Add if not selected
  
      return { ...prevData, preferences: updatedPreferences };
    });
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
    if (formData.role === 'event_organizer' && !formData.pdf) {
      setError('Event Organizers must upload a PDF');
      return false;
    }

    if (formData.role=== 'user'&&  formData.preferences.length === 0 ) {
      setError("Please select at least one preference.");
      return;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(''); 


    const endpoint = formData.role === 'event_organizer' ? '/eventOrgRegister' : '/register';
    const formDataToSend = new FormData();

    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('password_confirmation', formData.password_confirmation);
    formDataToSend.append('role', formData.role);
    formData.preferences.forEach((preference, index) => {
      formDataToSend.append(`preferences[${index}]`, preference);
    });

    if (formData.role === 'event_organizer' && formData.pdf) {
      formDataToSend.append('pdf', formData.pdf);
    }

    try {
      const response = await api.post(endpoint, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/events');
    } catch (error) {
      if (error.response?.data?.errors) {
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
                  name="name" 
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="input">
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="input">
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Password"
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
                  name="password_confirmation" 
                  placeholder="Confirm Password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Role Selection */}
<div className="input">
  <select name="role" value={formData.role} onChange={handleChange} disabled={loading}>
    <option value="user">User</option>
    <option value="event_organizer">Event Organizer</option>
  </select>
</div>

{/* Show Preferences if User is selected */}
{formData.role === 'user' && (
  <div className="input file-upload preferences-container">  
    <label>Preferences</label> <br />
    
    <div className="preferences-options">
      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Music" 
          checked={formData.preferences.includes("Music")}
          onChange={handleCheckboxChange}
        />
        Music
      </label>

      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Technology" 
          checked={formData.preferences.includes("Technology")}
          onChange={handleCheckboxChange}
        />
        Technology
      </label>

      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Sports" 
          checked={formData.preferences.includes("Sports")}
          onChange={handleCheckboxChange}
        />
        Sports
      </label>

      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Arts" 
          checked={formData.preferences.includes("Arts")}
          onChange={handleCheckboxChange}
        />
        Arts
      </label>

      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Food & Drink" 
          checked={formData.preferences.includes("Food & Drink")}
          onChange={handleCheckboxChange}
        />
        Food & Drink
      </label>

      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Business" 
          checked={formData.preferences.includes("Business")}
          onChange={handleCheckboxChange}
        />
        Business
      </label>

      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Education" 
          checked={formData.preferences.includes("Education")}
          onChange={handleCheckboxChange}
        />
        Education
      </label>

      <label>
        <input 
          type="checkbox" 
          name="preferences" 
          value="Other" 
          checked={formData.preferences.includes("Other")}
          onChange={handleCheckboxChange}
        />
        Other
      </label>
    </div>
  </div>
)}


{/* Show PDF Upload only if Event Organizer is selected */}
{formData.role === 'event_organizer' && (
  <div className="input file-upload">
    <label htmlFor="pdf-upload">Upload PDF File</label>
    <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} disabled={loading} />
  </div>
)}
              
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
  );
}

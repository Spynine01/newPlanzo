import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Signup.css'

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      // TODO: Add API call to register
      console.log('Signup attempt with:', formData);
      // navigate('/login'); // Uncomment after API integration
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <div>
      <div className="container">
        <div className="drop">
            <div className="context">
                <h2>Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input">
                        <input 
                          type="text" 
                          name='username' 
                          placeholder='Username'
                          value={formData.username}
                          onChange={handleChange}
                          required
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
                        />
                    </div>
                    <div className="input">
                        <input 
                          type="password" 
                          name='confirmPassword' 
                          placeholder='Confirm Password'
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                    </div>
                    <div className="input">
                        <input type="submit" value='Sign Up' />
                    </div>
                </form>
            </div>
        </div>
        <Link to="/login" className="btn signup">Login</Link>
      </div>
    </div>
  )
}

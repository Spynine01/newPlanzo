import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Add API call to login
      console.log('Login attempt with:', formData);
      // navigate('/dashboard'); // Uncomment after API integration
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <div className="container">
        <div className="drop">
            <div className="context">
                <h2>Sign In</h2>
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
                          type="password" 
                          name='password' 
                          placeholder='Password'
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                    </div>
                    <div className="input">
                        <input type="submit" value='Login' />
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

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
const AuthContext = createContext();

// Create a custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps your app and provides the auth context value
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName');
      const email = localStorage.getItem('userEmail');
      
      // Check if token exists and set auth state
      setIsAuthenticated(!!token);
      setUserRole(role || '');
      setUserName(name || '');
      setUserEmail(email || '');
      
      // Only set loading to false after auth state is updated
      setTimeout(() => {
        setLoading(false);
      }, 100);
    };

    checkAuthStatus();

    // Set up a storage event listener to catch changes from other tabs/windows
    window.addEventListener('storage', checkAuthStatus);
    
    // Custom event for auth changes within same window
    window.addEventListener('auth-change', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('auth-change', checkAuthStatus);
    };
  }, []);

  // Login function
  const login = (token, user, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('userName', user?.name || '');
    localStorage.setItem('userEmail', user?.email || '');
    
    setIsAuthenticated(true);
    setUserRole(role || '');
    setUserName(user?.name || '');
    setUserEmail(user?.email || '');
    
    // Dispatch a custom event to notify of auth change
    window.dispatchEvent(new Event('auth-change'));
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    setIsAuthenticated(false);
    setUserRole('');
    setUserName('');
    setUserEmail('');
    
    // Dispatch a custom event to notify of auth change
    window.dispatchEvent(new Event('auth-change'));
  };

  const value = {
    isAuthenticated,
    userRole,
    userName,
    userEmail,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 
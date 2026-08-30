import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem('deadlock_token');
    if (token) {
      authAPI.getMe()
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('deadlock_token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('deadlock_token', res.data.token);
      setUser(res.data.user);
      showNotification(`Welcome back, ${res.data.user.name}!`, 'success');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      showNotification(msg, 'error');
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);
      localStorage.setItem('deadlock_token', res.data.token);
      setUser(res.data.user);
      showNotification(`Account created successfully! Welcome, ${res.data.user.name}`, 'success');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      showNotification(msg, 'error');
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('deadlock_token');
    setUser(null);
    showNotification('Logged out successfully.', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, notification, showNotification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

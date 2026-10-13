import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default auth headers for axios if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Load user profile on mount / token change
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await axios.get('/api/auth/profile');
        if (data.success) {
          const u = data;
          if (!u.role && u.roles) {
            u.role = u.roles.admin ? 'admin' : u.roles.seller ? 'seller' : 'buyer';
          }
          setUser(u);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const { data } = await axios.post('/api/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        const u = data;
        if (!u.role && u.roles) {
          u.role = u.roles.admin ? 'admin' : u.roles.seller ? 'seller' : 'buyer';
        }
        setUser(u);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (formData) => {
    try {
      setError(null);
      setLoading(true);
      const { data } = await axios.post('/api/auth/register', formData);
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        const u = data;
        if (!u.role && u.roles) {
          u.role = u.roles.admin ? 'admin' : u.roles.seller ? 'seller' : 'buyer';
        }
        setUser(u);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const { data } = await axios.post('/api/auth/google', { idToken });
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        const u = data;
        if (!u.role && u.roles) {
          u.role = u.roles.admin ? 'admin' : u.roles.seller ? 'seller' : 'buyer';
        }
        setUser(u);
        return { success: true };
      } else {
        setError(data.message || 'Google login failed');
        return { success: false, message: data.message || 'Google login failed' };
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      let errMsg = 'Google login failed';
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        errMsg = 'Google sign-in was cancelled';
      } else if (err.code === 'auth/unauthorized-domain') {
        errMsg = 'Domain unauthorized in Firebase. Please add localhost to Authorized Domains in Firebase Console (Authentication > Settings > Authorized Domains).';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Google Sign-In is not enabled in Firebase. Please enable Google under Authentication > Sign-in method in Firebase Console.';
      } else if (err.code === 'auth/popup-blocked') {
        errMsg = 'Sign-in popup was blocked by the browser. Please allow popups for this site.';
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = 'Network connection error while communicating with Firebase.';
      } else if (err.code === 'auth/invalid-api-key') {
        errMsg = 'Invalid Firebase API configuration key.';
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    try {
      signOut(auth).catch(() => {});
    } catch (e) {}
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setError(null);
  };

  // Update profile
  const updateProfile = async (formData) => {
    try {
      setError(null);
      setLoading(true);
      const { data } = await axios.put('/api/auth/profile', formData);
      if (data.success) {
        const u = data;
        if (!u.role && u.roles) {
          u.role = u.roles.admin ? 'admin' : u.roles.seller ? 'seller' : 'buyer';
        }
        setUser(u);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Update failed';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile dynamically from server
  const refreshUser = async () => {
    if (!token) return null;
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await axios.get('/api/auth/profile');
      if (data.success) {
        const u = data;
        if (!u.role && u.roles) {
          u.role = u.roles.admin ? 'admin' : u.roles.seller ? 'seller' : 'buyer';
        }
        setUser(u);
        return u;
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

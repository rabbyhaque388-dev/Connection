import React, { createContext, useContext, useState, useEffect } from 'react';
import API, { setAccessToken, getAccessToken } from '../api/client';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth, googleProvider } from '../api/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear states on user logout or session expiry
  const clearSession = () => {
    setUser(null);
    setAccessToken('');
    setLoading(false);
  };

  // 1. Authenticate user session on boot
  const loadUser = async () => {
    try {
      // Prompt a token refresh to acquire access token
      const res = await API.post('/auth/refresh');
      const { accessToken } = res.data;
      setAccessToken(accessToken);

      // Fetch user profile details
      const meRes = await API.get('/auth/me');
      setUser(meRes.data.user);
    } catch (err) {
      console.log('No active session identified.');
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // Listen for axios token expiry redirections
    const handleExpiry = () => {
      clearSession();
      setError('Your session has expired. Please log in again.');
    };
    window.addEventListener('auth_session_expired', handleExpiry);

    return () => {
      window.removeEventListener('auth_session_expired', handleExpiry);
    };
  }, []);

  // 2. User Sign Up
  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/auth/register', formData);
      const { user: userRecord, accessToken } = res.data;
      setAccessToken(accessToken);
      setUser(userRecord);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // 3. User Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/auth/login', { email, password });
      const { user: userRecord, accessToken } = res.data;
      setAccessToken(accessToken);
      setUser(userRecord);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Incorrect email or password.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // 4. User Logout
  const logout = async () => {
    setLoading(true);
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err.message);
    } finally {
      clearSession();
    }
  };

  // 5. Update Profile details
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await API.put('/users/profile', profileData);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 6. Add Profile Photo
  const addPhoto = async (photoFile) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const res = await API.post('/users/profile/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Photo upload failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 7. Delete Profile Photo
  const removePhoto = async (photoId) => {
    setError(null);
    try {
      const res = await API.delete(`/users/profile/photos/${photoId}`);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Photo deletion failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 8. Change Password
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      const res = await API.put('/users/profile/password', { currentPassword, newPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Password change failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 9. Update Privacy Settings
  const updatePrivacy = async (showInDiscovery) => {
    setError(null);
    try {
      const res = await API.put('/users/profile/privacy', { showInDiscovery });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update privacy settings';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 10. Delete Account
  const deleteAccount = async () => {
    setError(null);
    try {
      await API.delete('/users/profile/account');
      clearSession();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete account';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 11. Google Sign-In with Firebase Authentication
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      let idToken;
      if (auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      } else {
        console.warn('Firebase Config missing: executing Simulated Auth Mode.');
        idToken = JSON.stringify({
          email: 'alex@example.com',
          name: 'Alex Sandbox',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'
        });
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const res = await API.post('/auth/firebase', { idToken });
      const { user: userRecord, accessToken } = res.data;
      setAccessToken(accessToken);
      setUser(userRecord);
      return { success: true };
    } catch (err) {
      // User closed the Google popup — silently ignore
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return { success: false, error: null };
      }
      // Backend unreachable
      const isNetworkError = !err.response && err.message === 'Network Error';
      const msg = isNetworkError
        ? 'Cannot reach the server. Make sure the backend is running on port 5000.'
        : err.response?.data?.message || err.message || 'Google Authentication failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // 12. Firebase Email/Password Registration
  const registerWithFirebaseEmail = async (email, password, profileData = {}) => {
    setLoading(true);
    setError(null);
    try {
      let idToken;
      if (auth) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        idToken = await result.user.getIdToken();
      } else {
        console.warn('Firebase Config missing: simulating email/password registration.');
        idToken = JSON.stringify({ email, name: profileData.name || email.split('@')[0] });
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const res = await API.post('/auth/firebase', { idToken, ...profileData });
      const { user: userRecord, accessToken } = res.data;
      setAccessToken(accessToken);
      setUser(userRecord);
      return { success: true };
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Try logging in instead.'
        : err.code === 'auth/weak-password'
          ? 'Password is too weak. Please use at least 6 characters.'
          : err.response?.data?.message || err.message || 'Firebase registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // 13. Firebase Email/Password Login
  const loginWithFirebaseEmail = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      let idToken;
      if (auth) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        idToken = await result.user.getIdToken();
      } else {
        console.warn('Firebase Config missing: simulating email/password login.');
        idToken = JSON.stringify({ email, name: email.split('@')[0] });
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const res = await API.post('/auth/firebase', { idToken });
      const { user: userRecord, accessToken } = res.data;
      setAccessToken(accessToken);
      setUser(userRecord);
      return { success: true };
    } catch (err) {
      const isNetworkError = !err.response && err.message === 'Network Error';
      const msg = isNetworkError
        ? 'Cannot reach the server. Make sure the backend is running on port 5000.'
        : err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.response?.data?.message || err.message || 'Firebase login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // 14. Send Firebase Email Sign-In Link (Passwordless)
  const sendFirebaseEmailLink = async (email) => {
    setError(null);
    try {
      if (auth) {
        const actionCodeSettings = {
          url: `${window.location.origin}/confirm-email-login`,
          handleCodeInApp: true
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
      } else {
        console.warn('Firebase Config missing: simulating email link send.');
        window.localStorage.setItem('emailForSignIn', email);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to send sign-in link';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 15. Complete Firebase Email Link Sign-In
  const completeFirebaseEmailLink = async (email, url) => {
    setLoading(true);
    setError(null);
    try {
      let idToken;
      if (auth) {
        const result = await signInWithEmailLink(auth, email, url);
        window.localStorage.removeItem('emailForSignIn');
        idToken = await result.user.getIdToken();
      } else {
        console.warn('Firebase Config missing: simulating email link completion.');
        window.localStorage.removeItem('emailForSignIn');
        idToken = JSON.stringify({ email, name: email.split('@')[0] });
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const res = await API.post('/auth/firebase', { idToken });
      const { user: userRecord, accessToken } = res.data;
      setAccessToken(accessToken);
      setUser(userRecord);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Email link sign-in failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    registerWithFirebaseEmail,
    loginWithFirebaseEmail,
    sendFirebaseEmailLink,
    completeFirebaseEmailLink,
    loadUser,
    logout,
    updateProfile,
    addPhoto,
    removePhoto,
    changePassword,
    updatePrivacy,
    deleteAccount,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be nested within AuthProvider');
  }
  return context;
};

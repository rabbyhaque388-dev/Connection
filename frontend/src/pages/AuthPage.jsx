import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  // Auth modes: 'login', 'register', 'email-link'
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'male',
    preference: 'female',
    bio: '',
    location: ''
  });
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  const {
    login,
    register,
    loginWithGoogle,
    registerWithFirebaseEmail,
    loginWithFirebaseEmail,
    sendFirebaseEmailLink,
    error: authError,
    setError: setAuthError
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any stale errors when the auth page mounts
  useEffect(() => {
    setAuthError(null);
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null); // Clear any previous error before attempting
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (authError) setAuthError(null);
    if (emailLinkSent) setEmailLinkSent(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'login') {
        // Firebase Email/Password Login
        const result = await loginWithFirebaseEmail(formData.email, formData.password);
        if (result.success) {
          navigate('/');
        }
      } else if (authMode === 'register') {
        // Firebase Email/Password Registration with profile data
        const profileData = {
          name: formData.name,
          age: parseInt(formData.age, 10),
          gender: formData.gender,
          preference: formData.preference,
          bio: formData.bio,
          location: formData.location
        };
        const result = await registerWithFirebaseEmail(formData.email, formData.password, profileData);
        if (result.success) {
          navigate('/');
        }
      } else if (authMode === 'email-link') {
        // Firebase Email Link (Passwordless)
        const result = await sendFirebaseEmailLink(formData.email);
        if (result.success) {
          setEmailLinkSent(true);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setAuthError(null);
    setEmailLinkSent(false);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden font-sans">
      {/* Decorative premium glass background nodes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl z-10 flex flex-col">
        {/* Animated Brand Vector Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            connection<span className="text-rose-500">.</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
            Find your match in real-time
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
              authMode === 'login' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
              authMode === 'register' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => switchMode('email-link')}
            className={`py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
              authMode === 'email-link' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Error Feedback Alerts */}
        {authError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3.5 rounded-xl mb-6 font-semibold flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{authError}</span>
          </div>
        )}

        {/* Success: Email Link Sent */}
        {emailLinkSent && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3.5 rounded-xl mb-6 font-semibold flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Magic link sent to <strong>{formData.email}</strong>! Check your inbox and click the link to log in.</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Registration Form fields */}
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="18"
                    placeholder="Min 18"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. London"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    My Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-rose-500 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Interested In
                  </label>
                  <select
                    name="preference"
                    value={formData.preference}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-rose-500 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email field — always visible */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="e.g. john@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              onFocus={() => setAuthError(null)}
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
            />
          </div>

          {/* Password field — visible for login and register modes only */}
          {authMode !== 'email-link' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Secure Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="At least 6 chars"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setAuthError(null)}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
              />
            </div>
          )}

          {/* Email Link mode info text */}
          {authMode === 'email-link' && !emailLinkSent && (
            <p className="text-xs text-slate-500 leading-relaxed px-1">
              We'll send a secure, passwordless magic link to your email.
              Click the link in your inbox to log in instantly — no password needed!
            </p>
          )}

          <button
            type="submit"
            disabled={loading || emailLinkSent}
            className="w-full mt-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-rose-500/25 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : authMode === 'login' ? (
              'Enter Connection'
            ) : authMode === 'register' ? (
              'Create Match Profile'
            ) : emailLinkSent ? (
              '✓ Link Sent — Check Inbox'
            ) : (
              'Send Magic Link'
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative px-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-900/80 backdrop-blur-xl">
            or
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-slate-950/40 hover:bg-slate-950/80 text-white font-semibold py-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.524 0-6.386-2.862-6.386-6.386 0-3.524 2.862-6.386 6.386-6.386 1.63 0 3.116.618 4.256 1.63l2.97-2.97C19.262 2.612 15.932 1.5 12.24 1.5 6.446 1.5 1.75 6.196 1.75 12s4.696 10.5 10.49 10.5c6.046 0 10.05-4.246 10.05-10.222 0-.693-.075-1.353-.21-1.993H12.24z"
            />
          </svg>
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            'Continue with Google'
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;

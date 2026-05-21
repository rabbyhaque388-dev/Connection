import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import API, { setAccessToken } from '../api/client';
import Loader from '../components/ui/Loader';

const ConfirmEmailLogin = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'prompt_email', 'loading', 'success', 'error'
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { setError: setAuthError, loadUser } = useAuth();
  const navigate = useNavigate();

  const completeEmailSignIn = async (userEmail) => {
    setStatus('loading');
    try {
      let idToken;
      if (auth) {
        const result = await signInWithEmailLink(auth, userEmail, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        idToken = await result.user.getIdToken();
      } else {
        // Fallback for development sandbox simulation
        console.warn('Firebase disabled: simulating email link login');
        idToken = JSON.stringify({
          email: userEmail,
          name: userEmail.split('@')[0],
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Send to MERN backend
      const res = await API.post('/auth/firebase', { idToken });
      const { accessToken } = res.data;

      setAccessToken(accessToken);
      
      // Load user into global AuthContext state
      await loadUser();

      setStatus('success');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Email sign in error:', err);
      setStatus('error');
      setErrorMsg(err.response?.data?.message || err.message || 'Verification failed. The link might be expired or invalid.');
    }
  };

  useEffect(() => {
    const handleVerification = async () => {
      // Check if it is a valid email sign in link
      const isLink = auth 
        ? isSignInWithEmailLink(auth, window.location.href)
        : window.location.search.includes('apiKey=') || window.location.search.includes('sandbox=');

      if (!isLink) {
        setStatus('error');
        setErrorMsg('Invalid sign-in link. Please request a new one.');
        return;
      }

      // Try fetching email from local storage
      const storedEmail = window.localStorage.getItem('emailForSignIn');
      if (storedEmail) {
        setEmail(storedEmail);
        await completeEmailSignIn(storedEmail);
      } else {
        setStatus('prompt_email');
      }
    };

    handleVerification();
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    await completeEmailSignIn(email);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl z-10 flex flex-col text-center">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 animate-pulse">
            <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            connection<span className="text-rose-500">.</span>
          </h1>
        </div>

        {status === 'verifying' && (
          <div className="py-6 flex flex-col items-center gap-4">
            <span className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></span>
            <p className="text-slate-300 font-semibold">Verifying your magic link...</p>
            <p className="text-xs text-slate-500">Securely parsing authentication parameters.</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="py-6 flex flex-col items-center gap-4">
            <span className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></span>
            <p className="text-slate-300 font-semibold">Completing connection session...</p>
            <p className="text-xs text-slate-500">Issuing server-side security tokens.</p>
          </div>
        )}

        {status === 'prompt_email' && (
          <div className="text-left space-y-4">
            <h2 className="text-lg font-bold text-white text-center">Confirm Your Email Address</h2>
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              You opened this link on a different device or browser. To verify your identity, please enter the email address where you requested the link.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-rose-500/25 flex items-center justify-center cursor-pointer text-sm"
              >
                Verify & Log In
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center gap-4 text-emerald-400">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-white">Successfully Logged In!</p>
            <p className="text-xs text-slate-400">Redirecting to your dating feed...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 text-rose-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-bold text-rose-400">Verification Failed</p>
            <p className="text-xs text-slate-400 px-4 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailLogin;

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Zap } from 'lucide-react';

const MatchModal = ({ isOpen, matchDetails, onClose, onSendMessage }) => {
  const { user: currentUser } = useAuth();

  if (!isOpen || !matchDetails) return null;

  const { partner } = matchDetails;

  const getUserPhoto = (userObj) => {
    if (userObj?.photos && userObj.photos.length > 0) {
      const photoUrl = userObj.photos[0].url;
      return photoUrl.startsWith('/uploads') 
        ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${photoUrl}` 
        : photoUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj?.name || 'User')}&background=fe3c72&color=fff&bold=true`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-sans overflow-hidden">
      
      {/* Animated premium matching background halos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md flex flex-col items-center text-center relative z-10 animate-fade-in">
        
        {/* Animated Matching Badge icon */}
        <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-rose-500/25 mb-4 animate-bounce">
          <Zap className="w-8 h-8 text-white fill-current" />
        </div>

        {/* Dynamic Match Headers */}
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 tracking-tight leading-none">
          It's a Match!
        </h2>
        <p className="text-slate-400 font-semibold text-sm mt-3 px-6">
          You and <span className="text-white">{partner?.name}</span> have liked each other.
        </p>

        {/* Dynamic side-by-side avatar rings */}
        <div className="flex items-center justify-center gap-6 my-10 relative">
          
          {/* Current User avatar frame */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-rose-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <img
              src={getUserPhoto(currentUser)}
              alt="My Avatar"
              className="relative w-28 h-28 rounded-full border-4 border-slate-950 object-cover shadow-2xl"
            />
          </div>

          {/* Connect center heart badge */}
          <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-2xl z-10">
            <svg className="w-5 h-5 text-rose-500 fill-current animate-pulse" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          {/* Matched User avatar frame */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-orange-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <img
              src={getUserPhoto(partner)}
              alt={`${partner?.name}'s Avatar`}
              className="relative w-28 h-28 rounded-full border-4 border-slate-950 object-cover shadow-2xl"
            />
          </div>

        </div>

        {/* Buttons to direct user behavior */}
        <div className="flex flex-col w-full gap-3 px-6">
          <button
            onClick={onSendMessage}
            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all duration-300 cursor-pointer text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            Send a Message
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-bold py-4 rounded-2xl hover:text-white hover:bg-slate-800/80 active:scale-[0.98] transition-all duration-300 cursor-pointer text-sm"
          >
            Keep Swiping
          </button>
        </div>

      </div>

    </div>
  );
};

export default MatchModal;

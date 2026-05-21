import React, { useState, useRef, useEffect } from 'react';
import { X, PhoneCall, Video, MoreVertical } from 'lucide-react';

/**
 * ChatHeader — Top bar of the active chat window.
 * Shows partner avatar, name, online status, and action buttons.
 *
 * @prop {object}   partner        - Partner user object { _id, name, photos }
 * @prop {boolean}  isOnline       - Whether the partner is currently online
 * @prop {function} onBack         - Called when the mobile back button is pressed
 * @prop {function} onUnmatch      - Called when "Unmatch" is selected from the menu
 */
const ChatHeader = ({ partner, isOnline, onBack, onUnmatch }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPartnerPhoto = () => {
    if (partner?.photos && partner.photos.length > 0) {
      const url = partner.photos[0].url;
      return url.startsWith('/uploads') ? `http://localhost:5000${url}` : url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      partner?.name || 'User'
    )}&background=fe3c72&color=fff&bold=true`;
  };

  return (
    <div className="h-16 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-md z-10 flex-shrink-0">
      {/* Left — back button (mobile) + avatar + info */}
      <div className="flex items-center gap-3">
        <button
          id="chat-back-btn"
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Back to inbox"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          <img
            src={getPartnerPhoto()}
            alt={partner?.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-800"
          />
          {/* Online status dot */}
          <div
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 transition-colors duration-500 ${
              isOnline ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          />
        </div>

        <div className="flex flex-col text-left">
          <span className="font-bold text-sm text-slate-100 leading-tight">
            {partner?.name}
          </span>
          <span
            className={`text-[10px] uppercase tracking-widest font-semibold mt-0.5 ${
              isOnline ? 'text-emerald-500' : 'text-slate-500'
            }`}
          >
            {isOnline ? 'Online Now' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Right — action icons */}
      <div className="flex items-center gap-1" ref={menuRef}>
        <button
          className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Voice call (coming soon)"
        >
          <PhoneCall className="w-4.5 h-4.5" />
        </button>
        <button
          className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Video call (coming soon)"
        >
          <Video className="w-4.5 h-4.5" />
        </button>
        <button
          id="chat-options-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Chat options"
        >
          <MoreVertical className="w-4.5 h-4.5" />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-4 top-14 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-30">
            <button
              id="unmatch-btn"
              onClick={() => {
                setMenuOpen(false);
                onUnmatch();
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
            >
              Unmatch profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;

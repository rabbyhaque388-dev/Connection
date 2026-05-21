import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Flame, MessageCircle, User, LogOut } from 'lucide-react';
import NotificationPanel from '../ui/NotificationPanel';

const Shell = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const navLinks = [
    { path: '/', label: 'Discovery', icon: Flame },
    { path: '/chat', label: 'Messages', icon: MessageCircle },
    { path: '/profile', label: 'My Profile', icon: User }
  ];

  const getProfilePhoto = () => {
    if (user?.photos && user.photos.length > 0) {
      const photoUrl = user.photos[0].url;
      // Serve local fallback if relative uploader URL
      return photoUrl.startsWith('/uploads') 
        ? `http://localhost:5000${photoUrl}` 
        : photoUrl;
    }
    // Elegant fallback SVG avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=fe3c72&color=fff&bold=true`;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      
      {/* 1. Desktop Side Navigation Panel */}
      <aside className="hidden md:flex flex-col w-80 bg-slate-900 border-r border-slate-800 shadow-2xl z-20">
        
        {/* User Account Info Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <img
            src={getProfilePhoto()}
            alt="Profile Avatar"
            className="w-11 h-11 rounded-full border-2 border-rose-500 object-cover shadow-lg flex-shrink-0"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-semibold text-slate-100 truncate text-sm">{user?.name}</h3>
            <span className="text-xs text-slate-400 capitalize">{user?.gender}, {user?.age} yrs</span>
          </div>
          {/* Notification Bell — desktop */}
          <NotificationPanel
            isOpen={notifOpen}
            onToggle={() => setNotifOpen((prev) => !prev)}
          />
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/35 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout Account
          </button>
        </div>
      </aside>

      {/* 2. Primary Page Context Container */}
      <main className="flex-1 flex flex-col relative h-[calc(100vh-64px)] md:h-screen bg-slate-950 overflow-hidden">
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col p-4 md:p-6 overflow-hidden">
          {children}
        </div>
      </main>

      {/* 3. Responsive Mobile Bottom Bar */}
      <nav className="md:hidden h-16 bg-slate-900 border-t border-slate-800/80 flex items-center justify-around px-2 shadow-lg z-30">
        {navLinks.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-all duration-300 ${
                isActive ? 'text-rose-500 scale-110' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-1">{label}</span>
            </Link>
          );
        })}
        {/* Notification Bell — mobile */}
        <div className="flex flex-col items-center justify-center w-14 h-12">
          <NotificationPanel
            isOpen={notifOpen}
            onToggle={() => setNotifOpen((prev) => !prev)}
          />
          <span className="text-[10px] font-semibold mt-1 text-slate-400">Alerts</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Logout</span>
        </button>
      </nav>

    </div>
  );
};

export default Shell;

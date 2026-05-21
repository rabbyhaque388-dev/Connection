import React, { useRef, useEffect } from 'react';
import { Bell, Heart, MessageSquare, X, CheckCheck } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';

/**
 * NotificationPanel — Bell icon with a dropdown panel showing user notifications.
 * Clicking the bell opens/closes the panel. Notifications are marked read on view.
 */
const NotificationPanel = ({ isOpen, onToggle }) => {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } =
    useNotifications();
  const panelRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const getIcon = (type) => {
    switch (type) {
      case 'match':
        return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getMessage = (notif) => {
    const name = notif.sender?.name || 'Someone';
    switch (notif.type) {
      case 'match':
        return `You and ${name} matched! 🎉`;
      case 'message':
        return `${name} sent you a message`;
      default:
        return 'New notification';
    }
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger button */}
      <button
        id="notification-bell-btn"
        onClick={onToggle}
        className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-rose-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <h4 className="font-bold text-slate-100 text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="py-10 text-center">
                <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-6">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && markAsRead(notif._id)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors duration-200 cursor-pointer ${
                    notif.read
                      ? 'hover:bg-slate-800/30'
                      : 'bg-slate-800/40 hover:bg-slate-800/60'
                  }`}
                >
                  {/* Sender avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        notif.sender?.photos?.[0]?.url?.startsWith('/uploads')
                          ? `http://localhost:5000${notif.sender.photos[0].url}`
                          : notif.sender?.photos?.[0]?.url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              notif.sender?.name || 'U'
                            )}&background=fe3c72&color=fff&bold=true`
                      }
                      alt={notif.sender?.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-800"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  {/* Message + time */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-relaxed ${
                        notif.read ? 'text-slate-400' : 'text-slate-200 font-semibold'
                      }`}
                    >
                      {getMessage(notif)}
                    </p>
                    <span className="text-[10px] text-slate-600 mt-1 block">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

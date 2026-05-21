import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

/**
 * MessageBubble — Renders a single chat message bubble.
 *
 * @prop {object}  message      - Message object { _id, text, image, sender, seen, createdAt }
 * @prop {boolean} isMine       - Whether the current user sent this message
 * @prop {string}  currentUser  - Current user's _id (for ownership check)
 */
const MessageBubble = ({ message, isMine }) => {
  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const imageUrl = message.image
    ? message.image.startsWith('/uploads')
      ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${message.image}`
      : message.image
    : null;

  return (
    <div
      className={`flex flex-col max-w-[72%] ${
        isMine ? 'self-end items-end' : 'self-start items-start'
      }`}
    >
      {/* Bubble */}
      <div
        className={`px-4 py-3 rounded-2xl shadow-md transition-all duration-200 ${
          isMine
            ? 'bg-rose-500 text-white rounded-tr-none'
            : 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800/80'
        }`}
      >
        {/* Image attachment */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Message attachment"
            className="rounded-xl max-w-full h-auto mb-2 border border-slate-950/30"
            loading="lazy"
          />
        )}

        {/* Text */}
        {message.text && (
          <p className="text-sm leading-relaxed break-words">{message.text}</p>
        )}
      </div>

      {/* Timestamp + read receipt */}
      <div className="flex items-center gap-1.5 mt-1 px-1">
        <span className="text-[10px] text-slate-500 font-medium">
          {formatTime(message.createdAt)}
        </span>
        {isMine && (
          <span className={`${message.seen ? 'text-rose-500' : 'text-slate-600'}`}>
            {message.seen ? (
              <CheckCheck className="w-3 h-3" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

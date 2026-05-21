import React from 'react';

/**
 * TypingIndicator — Animated three-dot bubble shown when the chat partner is typing.
 *
 * @prop {string} partnerName - Name of the typing partner (for accessibility)
 */
const TypingIndicator = ({ partnerName = 'Partner' }) => {
  return (
    <div
      className="flex flex-col self-start items-start max-w-[70%]"
      role="status"
      aria-label={`${partnerName} is typing`}
    >
      <div className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800/80 shadow-md">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;

import React from 'react';
import { X } from 'lucide-react';

/**
 * InterestTag — A pill-shaped interest badge with an optional remove button.
 *
 * @prop {string}   label      - The interest text to display
 * @prop {function} onRemove   - If provided, renders an × button to remove the tag
 * @prop {boolean}  readonly   - When true, suppresses the remove control
 */
const InterestTag = ({ label, onRemove, readonly = false }) => {
  return (
    <span className="inline-flex items-center gap-1.5 bg-slate-950/70 border border-slate-700/60 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-200 hover:border-rose-500/40 hover:text-slate-100 group">
      {label}
      {!readonly && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(label)}
          className="text-slate-500 hover:text-rose-500 transition-colors cursor-pointer focus:outline-none"
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default InterestTag;

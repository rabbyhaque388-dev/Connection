import React from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';

/**
 * PhotoGrid — Displays a user's photo array in a responsive grid.
 * Shows existing photos with a delete overlay, and an upload slot.
 *
 * @prop {Array}    photos      - Array of photo objects { _id, url }
 * @prop {boolean}  uploading   - Shows a spinner on the upload slot when true
 * @prop {function} onUpload    - Called with the selected File object
 * @prop {function} onDelete    - Called with a photoId to delete
 * @prop {number}   maxPhotos   - Maximum photos allowed (default: 6)
 */
const PhotoGrid = ({ photos = [], uploading = false, onUpload, onDelete, maxPhotos = 6 }) => {
  const canUpload = photos.length < maxPhotos;

  const resolveUrl = (url) =>
    url?.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${url}` : url;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onUpload) {
      onUpload(file);
      // Reset input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Existing photos */}
      {photos.map((photo) => (
        <div key={photo._id} className="relative group aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/60 shadow-md">
          <img
            src={resolveUrl(photo.url)}
            alt="Profile photo"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Delete overlay */}
          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <button
              type="button"
              onClick={() => onDelete && onDelete(photo._id)}
              className="p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 active:scale-90 transition-all cursor-pointer"
              aria-label="Delete photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Upload slot */}
      {canUpload && (
        <label className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-700 hover:border-rose-500/60 bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-slate-800/40 group">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 group-hover:bg-rose-500/10 group-hover:border-rose-500/40 transition-colors">
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">
                Add Photo
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};

export default PhotoGrid;

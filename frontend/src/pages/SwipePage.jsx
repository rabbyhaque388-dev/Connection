import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import API from '../api/client';
import Loader from '../components/ui/Loader';
import MatchModal from '../components/swipe/MatchModal';
import { Heart, X, Sparkles, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 1. Single Tinder Profile Card Component with Framer Motion Drag Gestures
const SwipeCard = ({ profile, onSwipe }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Dynamic rotations based on drag position
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  
  // Dynamic stamp opacity (Like / Nope indicator badges)
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = async (event, info) => {
    const threshold = 150;
    if (info.offset.x > threshold) {
      // Swipe Right -> Like
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe(profile._id, 'like');
    } else if (info.offset.x < -threshold) {
      // Swipe Left -> Nope
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe(profile._id, 'dislike');
    } else {
      // Snap back to origin
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const getPhotoUrl = (photos) => {
    if (photos && photos.length > 0) {
      const url = photos[0].url;
      return url.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${url}` : url;
    }
    return `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80`;
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, y, rotate }}
      className="absolute w-full h-[500px] max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 cursor-grab active:cursor-grabbing select-none will-change-transform z-10"
    >
      {/* Background Profile Photo */}
      <img
        src={getPhotoUrl(profile.photos)}
        alt={profile.name}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Dynamic Action Stamps */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-black text-3xl uppercase px-4 py-1.5 rounded-xl rotate-[-15deg] tracking-widest pointer-events-none font-sans"
      >
        Like
      </motion.div>

      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-black text-3xl uppercase px-4 py-1.5 rounded-xl rotate-[15deg] tracking-widest pointer-events-none font-sans"
      >
        Nope
      </motion.div>

      {/* Glassmorphism Profile Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-6 pt-12 flex flex-col justify-end text-left pointer-events-none">
        <h2 className="text-2xl font-black text-white flex items-baseline gap-2 truncate">
          {profile.name}
          <span className="text-lg font-bold text-slate-300">{profile.age}</span>
        </h2>

        {profile.location && (
          <p className="flex items-center gap-1 text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            {profile.location}
          </p>
        )}

        <p className="text-slate-300 text-sm mt-3 line-clamp-2 leading-relaxed">
          {profile.bio || "No biography provided yet."}
        </p>

        {/* Interests Grid tags */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {profile.interests.slice(0, 3).map((interest, idx) => (
              <span
                key={idx}
                className="bg-slate-950/65 backdrop-blur-sm border border-slate-800 text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// 2. Main Discovery Swipe Page View
const SwipePage = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchDetails, setMatchDetails] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const navigate = useNavigate();

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/discovery');
      setFeed(res.data.feed);
    } catch (err) {
      console.error('Failed to retrieve discovery feed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleSwipe = async (userId, type) => {
    try {
      const res = await API.post('/swipes', { swipedUserId: userId, type });
      
      // Mutual Match trigger checks
      if (res.data.match) {
        setMatchDetails(res.data.matchDetails);
        setShowMatchModal(true);
      }

      // Pop the swiped card from stack
      setFeed((prev) => prev.filter((profile) => profile._id !== userId));
    } catch (err) {
      console.error('Failed to register swipe:', err.message);
    }
  };

  const handleManualAction = (type) => {
    if (feed.length === 0) return;
    const topProfile = feed[0];
    handleSwipe(topProfile._id, type);
  };

  if (loading) {
    return <Loader fullScreen={false} message="Scouting matches..." />;
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center font-sans overflow-hidden py-4 md:py-6 h-full relative">
      
      {/* Mutual Match Modal mounting */}
      <MatchModal
        isOpen={showMatchModal}
        matchDetails={matchDetails}
        onClose={() => setShowMatchModal(false)}
        onSendMessage={() => {
          setShowMatchModal(false);
          navigate(`/chat?room=${matchDetails.matchId}`);
        }}
      />

      <div className="flex-1 w-full flex items-center justify-center relative min-h-[500px]">
        {feed.length > 0 ? (
          // Render profiles as cards stacked sequentially (reversed slice so top is rendered last and overlayed)
          feed
            .slice(0, 3)
            .reverse()
            .map((profile) => (
              <SwipeCard
                key={profile._id}
                profile={profile}
                onSwipe={handleSwipe}
              />
            ))
        ) : (
          // Empty State Layout when feed finishes
          <div className="flex flex-col items-center justify-center max-w-sm text-center px-8 py-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl select-none animate-fade-in">
            <div className="w-16 h-16 bg-slate-950 border border-slate-850 rounded-full flex items-center justify-center text-rose-500 mb-6 shadow-inner">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-white">Out of Profiles</h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              There is no one new nearby. Try expanding your age limits or dating preference criteria!
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-6 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer text-xs uppercase tracking-wider"
            >
              Update Preferences
            </button>
          </div>
        )}
      </div>

      {/* Action buttons controller footer */}
      {feed.length > 0 && (
        <div className="flex items-center gap-6 mt-6 select-none z-20">
          <button
            onClick={() => handleManualAction('dislike')}
            className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-rose-500 shadow-xl active:scale-90 hover:bg-rose-500/10 hover:border-rose-500/25 transition-all duration-300 cursor-pointer"
          >
            <X className="w-7 h-7 stroke-[3px]" />
          </button>
          <button
            onClick={() => handleManualAction('like')}
            className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 hover:brightness-110 shadow-rose-500/20 transition-all duration-300 cursor-pointer"
          >
            <Heart className="w-8 h-8 fill-current" />
          </button>
        </div>
      )}

    </div>
  );
};

export default SwipePage;

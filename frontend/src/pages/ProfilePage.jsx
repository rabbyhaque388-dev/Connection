import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, MapPin, Sparkles, Lock, UserX, ShieldAlert } from 'lucide-react';
import PhotoGrid from '../components/profile/PhotoGrid';
import InterestTag from '../components/profile/InterestTag';

const ProfilePage = () => {
  const { 
    user, 
    updateProfile, 
    addPhoto, 
    removePhoto,
    changePassword,
    updatePrivacy,
    deleteAccount 
  } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || 'male',
    preference: user?.preference || 'female',
    location: user?.location || '',
    bio: user?.bio || ''
  });

  const [interestsInput, setInterestsInput] = useState('');
  const [interests, setInterests] = useState(user?.interests || []);
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security & Settings State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [showInDiscovery, setShowInDiscovery] = useState(user?.showInDiscovery !== false);
  const [privacySaving, setPrivacySaving] = useState(false);

  // Synchronize local states when user context is updated (from seeder or photo uploaders)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        gender: user.gender || 'male',
        preference: user.preference || 'female',
        location: user.location || '',
        bio: user.bio || ''
      });
      setInterests(user.interests || []);
      setShowInDiscovery(user.showInDiscovery !== false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Photo Uploader logic — accepts a File object directly (for PhotoGrid)
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await addPhoto(file);
    } catch (err) {
      console.error('Failed to upload photo:', err.message);
    } finally {
      setUploading(false);
    }
  };

  // 2. Photo Removal logic
  const handlePhotoDelete = async (photoId) => {
    const confirm = window.confirm('Are you sure you want to remove this photo?');
    if (!confirm) return;

    try {
      await removePhoto(photoId);
    } catch (err) {
      console.error('Failed to remove photo:', err.message);
    }
  };

  // 3. Multi-tag Interests Input triggers
  const triggerAddInterest = () => {
    const val = interestsInput.trim().toLowerCase();
    if (val && !interests.includes(val)) {
      setInterests([...interests, val]);
      setInterestsInput('');
    }
  };

  const handleAddInterest = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAddInterest();
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter((i) => i !== interestToRemove));
  };

  // 4. Save form changes
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        interests
      };

      const result = await updateProfile(payload);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile changes:', err.message);
    } finally {
      setSaving(false);
    }
  };

  // 5. Change Password Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setPasswordSaving(true);
    setPasswordSuccess(false);
    setPasswordError('');

    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(res.error || 'Password change failed.');
      }
    } catch (err) {
      setPasswordError(err.message || 'An error occurred.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // 6. Toggle Privacy Settings
  const handlePrivacyToggle = async (e) => {
    const val = e.target.checked;
    setShowInDiscovery(val);
    setPrivacySaving(true);
    try {
      await updatePrivacy(val);
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
    } finally {
      setPrivacySaving(false);
    }
  };

  // 7. Delete Account Handler
  const handleDeleteAccount = async () => {
    const doubleConfirm = window.confirm(
      'WARNING: This will permanently delete your account, matches, chat history, and photos. This action CANNOT be undone.\n\nAre you sure you want to proceed?'
    );
    if (!doubleConfirm) return;

    const tripleConfirm = window.prompt(
      'Type "DELETE MY ACCOUNT" in all capitals to confirm absolute removal:'
    );
    if (tripleConfirm !== 'DELETE MY ACCOUNT') {
      window.alert('Confirmation phrase mismatched. Deletion canceled.');
      return;
    }

    try {
      const res = await deleteAccount();
      if (res.success) {
        window.location.href = '/auth';
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
      window.alert('Account deletion failed. Please try again.');
    }
  };

  const renderPhoto = (photoObj) => {
    const url = photoObj.url;
    return url.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${url}` : url;
  };

  return (
    <div className="flex-1 flex flex-col font-sans text-slate-100 overflow-y-auto px-1 py-4 md:py-6 h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      
      {/* Save success floating banner */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold flex items-center gap-3 z-50 animate-fade-in">
          <Check className="w-5 h-5 stroke-[3px]" />
          Profile settings saved successfully!
        </div>
      )}

      <h1 className="text-3xl font-black tracking-tight text-white mb-6 text-left">
        Edit Match Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Photo Grid Management & Privacy/Account Settings */}
        <section className="lg:col-span-1 space-y-6">
          
          {/* Photo Management Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Profile Photos (Max 6)
            </h3>

            <PhotoGrid
              photos={user?.photos || []}
              uploading={uploading}
              onUpload={handlePhotoUpload}
              onDelete={handlePhotoDelete}
              maxPhotos={6}
            />
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-4">
              Add up to 6 high-quality photos. The first image listed in the grid will be set as your primary search card cover!
            </p>
          </div>

          {/* Privacy & Account Settings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left space-y-6">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              Privacy & Settings
            </h3>

            {/* Privacy Toggle */}
            <div className="space-y-3">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Discovery Mode
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                    When active, your card profile will be shown in the discovery feed of nearby users.
                  </span>
                </div>
                <div className="relative inline-flex items-center select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={showInDiscovery}
                    onChange={handlePrivacyToggle}
                    className="sr-only peer"
                    id="discovery-toggle"
                  />
                  <div className="w-11 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-rose-500 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-5 after:transition-all peer-checked:bg-rose-500/20 border border-slate-800"></div>
                </div>
              </label>
            </div>

            <hr className="border-slate-800/80" />

            {/* Change Password Panel */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Update Security Password
              </span>

              {passwordSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 stroke-[3px]" />
                  Password successfully changed!
                </div>
              )}

              {passwordError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {passwordError}
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Current Password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/85 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-xs font-semibold"
                />
                <input
                  type="password"
                  placeholder="New Secure Password"
                  required
                  minLength="6"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/85 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving || !currentPassword || !newPassword}
                className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-extrabold py-2.5 rounded-xl active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest disabled:opacity-40"
              >
                {passwordSaving ? (
                  <span className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin"></span>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>

            <hr className="border-slate-800/80" />

            {/* Account Erasure (Danger Zone) */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">
                Danger Zone Actions
              </span>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Permanently erase matches, chat histories, uploaded photos, and matching metrics from the system.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white font-extrabold py-2.5 rounded-xl active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest"
              >
                <UserX className="w-4 h-4" />
                Delete My Account
              </button>
            </div>
          </div>

        </section>

        {/* Right Side: Profile Details form */}
        <section className="lg:col-span-2">
          <form
            onSubmit={handleFormSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-left"
          >
            {/* Row 1: Name & Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="18"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Genders & preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  My Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-rose-500 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Looking For (Preference)
                </label>
                <select
                  name="preference"
                  value={formData.preference}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-rose-500 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <option value="female">Female Profiles</option>
                  <option value="male">Male Profiles</option>
                  <option value="both">Both profiles</option>
                </select>
              </div>
            </div>

            {/* Row 3: Bio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Biography / About Me
              </label>
              <textarea
                name="bio"
                rows="4"
                placeholder="Write a catchy bio details..."
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors resize-none leading-relaxed"
              ></textarea>
            </div>

            {/* Row 4: Interests Multi Tag input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Hobbies & Interests (Press Enter or click Add to append tag)
              </label>
              
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Hiking, Cinema, Coffee"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  onKeyDown={handleAddInterest}
                  className="flex-1 bg-slate-950 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
                />
                <button
                  type="button"
                  onClick={triggerAddInterest}
                  className="bg-slate-850 hover:bg-rose-500 border border-slate-800 hover:border-rose-500 text-slate-300 hover:text-white px-5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[36px]">
                {interests.map((interest) => (
                  <InterestTag
                    key={interest}
                    label={`#${interest}`}
                    onRemove={() => handleRemoveInterest(interest)}
                  />
                ))}
                {interests.length === 0 && (
                  <span className="text-xs text-slate-600 font-semibold self-center">
                    No interests tags declared yet.
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer text-sm disabled:opacity-50 mt-4"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Save Profile Changes'
              )}
            </button>

          </form>
        </section>

      </div>

    </div>
  );
};

export default ProfilePage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe, type UserProfile } from '../api/users';
import { uploadImage } from '../api/uploads';
import { ArrowLeft, Camera, ShieldCheck, Loader2 } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    college: '',
    city: '',
    phone: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMe();
      setProfile(data);
      setFormData({
        name: data.name || '',
        college: data.college || '',
        city: data.city || '',
        phone: data.phone || ''
      });
    } catch (err) {
      console.error(err);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    setError('');
    try {
      const { url } = await uploadImage(file);
      // Immediately update profile with new avatar
      const updatedProfile = await updateMe({ avatar_url: url });
      setProfile(updatedProfile);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedProfile = await updateMe(formData);
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-gray-400">Loading...</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

        <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-500">
                {uploadingImage ? (
                  <Loader2 className="animate-spin text-[#6C63FF]" size={24} />
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#6C63FF] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#5b54d6] transition-colors shadow-lg">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
            
            <div>
              <h2 className="text-xl font-bold">{profile.name || 'Set your name'}</h2>
              <p className="text-gray-400 text-sm mb-2">{profile.email}</p>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                  <ShieldCheck size={14} /> Verified Student
                </div>
                <div className="text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  Trust Score: {profile.trust_score.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111113] border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold border-b border-white/10 pb-3">Personal Details</h3>
          
          {error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</div>}
          {success && <div className="text-emerald-400 text-sm bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">College Name</label>
              <input 
                type="text" 
                value={formData.college}
                onChange={e => setFormData({...formData, college: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
              <input 
                type="text" 
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number (Optional)</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-between items-center border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_id');
                navigate('/auth');
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
            >
              Log Out
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#6C63FF] hover:bg-[#5b54d6] text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="animate-spin" size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

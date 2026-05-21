import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createListing } from '../api/listings';
import { uploadImage } from '../api/uploads';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AddListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Books',
    condition: 'Good',
    type: 'sell',
    price: '',
    rent_per: 'day',
    deposit: '',
    location: 'Kolkata',
    images: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    setError('');
    try {
      const { url } = await uploadImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title || !formData.description) {
      setError('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    try {
      await createListing({
        ...formData,
        price: formData.type === 'donate' ? undefined : Number(formData.price) || 0,
        deposit: formData.type === 'rent' ? Number(formData.deposit) || 0 : undefined,
      });
      navigate('/marketplace');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 text-white flex justify-center">
      <div className="w-full max-w-2xl">
        <button 
          onClick={() => navigate('/marketplace')} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Marketplace
        </button>
        
        <div className="bg-[#111113] border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-2">List an Item</h1>
          <p className="text-gray-400 mb-8">Share what you no longer need with fellow students.</p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Item Title *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Engineering Mathematics Vol. 2" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF] appearance-none"
                >
                  <option className="bg-[#111113]" value="Books">Books</option>
                  <option className="bg-[#111113]" value="Electronics">Electronics</option>
                  <option className="bg-[#111113]" value="Lab Tools">Lab Tools</option>
                  <option className="bg-[#111113]" value="Hostel Essentials">Hostel Essentials</option>
                  <option className="bg-[#111113]" value="Stationery">Stationery</option>
                  <option className="bg-[#111113]" value="Sports">Sports</option>
                  <option className="bg-[#111113]" value="Clothing">Clothing</option>
                  <option className="bg-[#111113]" value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Condition *</label>
                <select 
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF] appearance-none"
                >
                  <option className="bg-[#111113]" value="New">New</option>
                  <option className="bg-[#111113]" value="Like New">Like New</option>
                  <option className="bg-[#111113]" value="Good">Good</option>
                  <option className="bg-[#111113]" value="Fair">Fair</option>
                  <option className="bg-[#111113]" value="Poor">Poor</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Listing Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {['sell', 'rent', 'donate'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                      formData.type === type 
                        ? 'bg-[#6C63FF]/20 border-[#6C63FF] text-[#6C63FF]' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.type !== 'donate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹) *</label>
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location / City *</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Kolkata" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item — edition, year, any notes..." 
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF] resize-none"
                required
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Images</label>
              <div className="flex gap-4 mb-4 overflow-x-auto">
                {formData.images.map((url, i) => (
                  <div key={i} className="w-24 h-24 rounded-xl border border-white/10 overflow-hidden flex-shrink-0">
                    <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:border-[#6C63FF] hover:text-[#6C63FF] cursor-pointer flex-shrink-0 transition-colors">
                    {uploadingImage ? <Loader2 className="animate-spin" size={24} /> : <span className="text-2xl">+</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full bg-[#6C63FF] hover:bg-[#5b54d6] text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

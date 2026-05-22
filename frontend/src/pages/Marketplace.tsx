import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getListings, type Listing } from '../api/listings';
import { Search, MapPin, Tag, Filter } from 'lucide-react';

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await getListings();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="CampusCrate Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-3xl font-bold mb-0.5">Marketplace</h1>
              <p className="text-gray-400 text-sm">Buy, sell, rent, or donate on campus</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/inbox" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
              Inbox
            </Link>
            <Link to="/profile" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
              Profile
            </Link>
            <Link to="/add-listing" className="bg-[#6C63FF] hover:bg-[#5b54d6] text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              + Add Listing
            </Link>
          </div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading listings...</div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-[#111113] border border-white/10 rounded-2xl">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-medium mb-2">No items found</h3>
            <p className="text-gray-400 mb-6">Be the first to list something!</p>
            <Link to="/add-listing" className="bg-[#6C63FF] text-white px-6 py-2.5 rounded-xl font-medium">
              + Add Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(item => (
              <Link to={`/listing/${item.id}`} key={item.id} className="bg-[#111113] border border-white/10 rounded-2xl overflow-hidden hover:border-[#6C63FF]/50 transition-colors cursor-pointer flex flex-col">
                <div className="h-48 bg-white/5 flex items-center justify-center text-4xl relative">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>📦</span>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 capitalize">
                    {item.type}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Tag size={12} />
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{item.condition}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 line-clamp-1">{item.title}</h3>
                  <div className="flex-1"></div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="text-xl font-bold text-white">
                      {item.type === 'donate' ? (
                        <span className="text-emerald-400">FREE</span>
                      ) : (
                        `₹${item.price}`
                      )}
                      {item.type === 'rent' && <span className="text-sm font-normal text-gray-400">/{item.rent_per || 'day'}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin size={14} />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

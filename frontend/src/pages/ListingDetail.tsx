import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListing, type Listing } from '../api/listings';
import { MapPin, Tag, Eye, MessageCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = localStorage.getItem('user_id');
  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    if (id) fetchListing(id);
  }, [id]);

  const fetchListing = async (listingId: string) => {
    try {
      const data = await getListing(listingId);
      setListing(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSeller = () => {
    if (!accessToken) {
      navigate('/auth');
      return;
    }
    if (!listing || !currentUserId) return;

    // Deterministic room_id: listingId_buyerId_sellerId
    const roomId = `${listing.id}_${currentUserId}_${listing.seller_id}`;
    navigate(`/chat/${roomId}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-gray-400">
      Loading...
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-gray-400">
      Listing not found.
    </div>
  );

  const isSeller = currentUserId === listing.seller_id;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/marketplace')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Marketplace
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-[#111113] border border-white/10 rounded-2xl h-80 flex items-center justify-center text-6xl overflow-hidden">
            {listing.images && listing.images.length > 0
              ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              : <span>📦</span>
            }
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Tag size={14} />
                <span>{listing.category}</span>
                <span>•</span>
                <span>{listing.condition}</span>
                <span>•</span>
                <span className="capitalize">{listing.type}</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">{listing.title}</h1>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <MapPin size={14} />
                <span>{listing.location}</span>
              </div>
            </div>

            <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold">
                {listing.type === 'donate'
                  ? <span className="text-emerald-400">FREE</span>
                  : <>₹{listing.price}{listing.type === 'rent' && <span className="text-base font-normal text-gray-400">/{listing.rent_per || 'day'}</span>}</>
                }
              </div>
              {listing.deposit && (
                <p className="text-sm text-gray-400 mt-1">Deposit: ₹{listing.deposit}</p>
              )}
            </div>

            <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
              <p className="text-gray-300 text-sm leading-relaxed">{listing.description}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Eye size={14} />
              <span>{listing.view_count} views</span>
              <span>•</span>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-emerald-400">Verified student</span>
            </div>

            {!isSeller ? (
              <button
                onClick={handleMessageSeller}
                className="w-full flex items-center justify-center gap-2 bg-[#6C63FF] hover:bg-[#5b54d6] text-white font-medium py-3 rounded-xl transition-colors"
              >
                <MessageCircle size={20} />
                {accessToken ? 'Message Seller' : 'Sign in to Message'}
              </button>
            ) : (
              <div className="w-full text-center py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm">
                This is your listing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

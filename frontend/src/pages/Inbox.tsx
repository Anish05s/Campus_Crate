import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms, type ChatRoom } from '../api/chat';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export default function Inbox() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/auth'); return; }
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-2xl font-bold mb-6">Inbox</h1>

        {loading ? (
          <div className="text-gray-400 text-center py-20">Loading conversations...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-[#111113] border border-white/10 rounded-2xl">
            <MessageCircle size={40} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-gray-400 mb-6">Find something you like and message the seller!</p>
            <button onClick={() => navigate('/marketplace')} className="bg-[#6C63FF] text-white px-6 py-2.5 rounded-xl font-medium">
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map(room => (
              <div
                key={room.room_id}
                onClick={() => navigate(`/chat/${room.room_id}`)}
                className="flex items-center gap-4 bg-[#111113] border border-white/10 hover:border-[#6C63FF]/50 rounded-2xl p-4 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/30 flex items-center justify-center text-lg font-bold text-[#6C63FF] flex-shrink-0">
                  {room.other_user.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold truncate">{room.other_user.name || 'Student'}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {new Date(room.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{room.latest_message}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">Re: {room.listing.title}</p>
                </div>

                {/* Unread badge */}
                {room.unread_count > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {room.unread_count}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

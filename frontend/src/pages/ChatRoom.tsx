import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatHistory, type ChatMessage } from '../api/chat';
import { Send, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUserId = localStorage.getItem('user_id');
  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    if (!accessToken) { navigate('/auth'); return; }
    if (!roomId) return;
    loadHistory();
    connectWs();
    return () => wsRef.current?.close();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const data = await getChatHistory(roomId!);
      setMessages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const connectWs = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBaseUrl = baseUrl.replace(/^https?/, (match) => match === 'https' ? 'wss' : 'ws');
    const wsUrl = `${wsBaseUrl}/chat/ws/${roomId}?token=${accessToken}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const msg: ChatMessage = JSON.parse(event.data);
      setMessages(prev => {
        // Avoid duplicates if we sent the message ourselves (it's broadcast back)
        const exists = prev.some(m => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
    };
  };

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111113] border-b border-white/10 flex-shrink-0">
        <button onClick={() => navigate('/inbox')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-sm truncate">Chat</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-400">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Verified chat</span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-400 text-center">
        🔒 Never share phone numbers or payment details in chat. Use the in-app meetup feature.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-10">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-[#6C63FF] text-white rounded-br-md'
                    : 'bg-[#1C1C1F] border border-white/10 text-gray-100 rounded-bl-md'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && (
                      <span className="ml-1">{msg.is_read ? ' ✓✓' : ' ✓'}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111113] border-t border-white/10 flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          maxLength={1000}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || !connected}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#6C63FF] hover:bg-[#5b54d6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

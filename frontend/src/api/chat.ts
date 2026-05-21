import client from './client';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoom {
  room_id: string;
  listing: { id: string; title: string; image: string | null };
  other_user: { id: string; name: string; avatar: string | null };
  latest_message: string;
  updated_at: string;
  unread_count: number;
}

export const getRooms = async () => {
  const response = await client.get('/chat/rooms');
  return response.data as ChatRoom[];
};

export const getChatHistory = async (roomId: string) => {
  const response = await client.get(`/chat/${roomId}/history`);
  return response.data as ChatMessage[];
};

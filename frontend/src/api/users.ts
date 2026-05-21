import client from './client';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  college: string | null;
  city: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  trust_score: number;
  created_at: string;
}

export interface UserUpdate {
  name?: string;
  college?: string;
  city?: string;
  phone?: string;
  avatar_url?: string;
}

export const getMe = async () => {
  const response = await client.get('/users/me');
  return response.data as UserProfile;
};

export const updateMe = async (data: UserUpdate) => {
  const response = await client.put('/users/me', data);
  return response.data as UserProfile;
};

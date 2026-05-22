import client from './client';

export const register = async (email: string, password: string) => {
  const response = await client.post('/auth/register', { email, password });
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const verifyOtp = async (email: string, otp: string) => {
  const response = await client.post('/auth/verify-otp', { email, otp });
  return response.data;
};

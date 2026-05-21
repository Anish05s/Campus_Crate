import client from './client';

export const requestOtp = async (email: string) => {
  const response = await client.post('/auth/request-otp', { email });
  return response.data;
};

export const verifyOtp = async (email: string, otp: string) => {
  const response = await client.post('/auth/verify-otp', { email, otp });
  return response.data;
};

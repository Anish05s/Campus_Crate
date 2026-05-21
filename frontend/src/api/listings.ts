import client from './client';

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  type: string;
  price?: number;
  rent_per?: string;
  deposit?: number;
  location: string;
  images: string[];
  is_active: boolean;
  is_flagged: boolean;
  view_count: number;
  created_at: string;
  expires_at: string;
}

export interface ListingCreate {
  title: string;
  description: string;
  category: string;
  condition: string;
  type: string;
  price?: number;
  rent_per?: string;
  deposit?: number;
  location: string;
  images: string[];
}

export const getListings = async (params?: Record<string, any>) => {
  const response = await client.get('/listings', { params });
  return response.data as Listing[];
};

export const getListing = async (id: string) => {
  const response = await client.get(`/listings/${id}`);
  return response.data as Listing;
};

export const createListing = async (data: ListingCreate) => {
  const response = await client.post('/listings', data);
  return response.data as Listing;
};

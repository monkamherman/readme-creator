export type AppRole = 'admin' | 'moderator' | 'user' | 'rider' | 'store';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  title: string;
  discount: number;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponInput {
  title: string;
  discount: number;
  enabled: boolean;
}

export interface Rider {
  id: string;
  user_id: string;
  username: string;
  name: string | null;
  phone: string | null;
  available: boolean;
  is_active: boolean;
  time_zone: string;
  latitude: number | null;
  longitude: number | null;
  notification_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiderOrder {
  id: string;
  rider_id: string;
  order_id: string;
  status: 'assigned' | 'picked_up' | 'delivered';
  assigned_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

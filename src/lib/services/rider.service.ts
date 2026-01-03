import { supabase } from '@/integrations/supabase/client';
import type { Rider, RiderOrder } from '@/lib/types/database.types';

export interface RiderLoginParams {
  timeZone?: string;
  notificationToken?: string;
}

export interface RiderLoginResult {
  riderId: string;
  userId: string;
  username: string;
  available: boolean;
}

export class RiderService {
  /**
   * Rider login - updates timezone and notification token
   */
  static async riderLogin(params: RiderLoginParams = {}): Promise<RiderLoginResult | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Vous devez être connecté');
    }

    const timeZone = params.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const { data, error } = await supabase.rpc('rider_login', {
      p_user_id: userData.user.id,
      p_time_zone: timeZone,
      p_notification_token: params.notificationToken || null,
    });

    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) {
      return null;
    }

    const rider = data[0];
    return {
      riderId: rider.rider_id,
      userId: rider.user_id,
      username: rider.username,
      available: rider.available,
    };
  }

  /**
   * Update rider location
   */
  static async updateRiderLocation(riderId: string, latitude: number, longitude: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_rider_location', {
      p_rider_id: riderId,
      p_latitude: latitude,
      p_longitude: longitude,
    });

    if (error) throw new Error(error.message);
    return data as boolean;
  }

  /**
   * Assign an order to a rider (admin/store only)
   */
  static async assignOrder(orderId: string, riderId: string): Promise<string> {
    const { data, error } = await supabase.rpc('assign_order_to_rider', {
      p_order_id: orderId,
      p_rider_id: riderId,
    });

    if (error) {
      if (error.message.includes('Unauthorized')) {
        throw new Error('Vous n\'avez pas les droits pour assigner des commandes');
      }
      if (error.message.includes('not available')) {
        throw new Error('Ce livreur n\'est pas disponible');
      }
      throw new Error(error.message);
    }
    return data as string;
  }

  /**
   * Pick up an order
   */
  static async pickupOrder(assignmentId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('pickup_order', {
      p_assignment_id: assignmentId,
    });

    if (error) throw new Error(error.message);
    return data as boolean;
  }

  /**
   * Deliver an order
   */
  static async deliverOrder(assignmentId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('deliver_order', {
      p_assignment_id: assignmentId,
    });

    if (error) throw new Error(error.message);
    return data as boolean;
  }

  /**
   * Get rider profile
   */
  static async getRiderProfile(): Promise<Rider | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return null;
    }

    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Rider | null;
  }

  /**
   * Update rider availability
   */
  static async updateAvailability(available: boolean): Promise<Rider> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Vous devez être connecté');
    }

    const { data, error } = await supabase
      .from('riders')
      .update({ available })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Rider;
  }

  /**
   * Get rider's assigned orders
   */
  static async getRiderOrders(): Promise<RiderOrder[]> {
    const { data, error } = await supabase
      .from('rider_orders')
      .select('*')
      .order('assigned_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as RiderOrder[];
  }

  /**
   * Get available riders (for stores/admins)
   */
  static async getAvailableRiders(): Promise<Rider[]> {
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('available', true)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    return data as Rider[];
  }
}

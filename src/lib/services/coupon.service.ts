import { supabase } from '@/integrations/supabase/client';
import type { Coupon, CouponInput } from '@/lib/types/database.types';
import { validateCoupon } from '@/lib/validations/coupon';

export class CouponService {
  /**
   * Get all coupons (admin only sees all, others see only enabled)
   */
  static async getCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Coupon[];
  }

  /**
   * Get a single coupon by ID
   */
  static async getCouponById(id: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Coupon | null;
  }

  /**
   * Create a new coupon (admin only)
   */
  static async createCoupon(input: CouponInput): Promise<Coupon> {
    // Validate input
    const validation = validateCoupon(input);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Vous devez être connecté pour créer un coupon');
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        title: input.title.trim(),
        discount: input.discount,
        enabled: input.enabled,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42501') {
        throw new Error('Vous n\'avez pas les droits pour créer un coupon');
      }
      throw new Error(error.message);
    }
    return data as Coupon;
  }

  /**
   * Update an existing coupon (admin only)
   */
  static async updateCoupon(id: string, input: Partial<CouponInput>): Promise<Coupon> {
    // Validate input if all fields are provided
    if (input.title !== undefined && input.discount !== undefined && input.enabled !== undefined) {
      const validation = validateCoupon(input);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.discount !== undefined) updateData.discount = input.discount;
    if (input.enabled !== undefined) updateData.enabled = input.enabled;

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '42501') {
        throw new Error('Vous n\'avez pas les droits pour modifier ce coupon');
      }
      throw new Error(error.message);
    }
    return data as Coupon;
  }

  /**
   * Delete a coupon (admin only)
   */
  static async deleteCoupon(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '42501') {
        throw new Error('Vous n\'avez pas les droits pour supprimer ce coupon');
      }
      throw new Error(error.message);
    }
    return true;
  }

  /**
   * Validate a coupon code by title
   */
  static async validateCouponByTitle(title: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('title', title)
      .eq('enabled', true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Coupon | null;
  }
}

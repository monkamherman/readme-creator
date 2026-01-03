import { useState, useCallback } from 'react';
import { CouponService } from '@/lib/services/coupon.service';
import type { Coupon, CouponInput } from '@/lib/types/database.types';

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CouponService.getCoupons();
      setCoupons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCoupon = useCallback(async (input: CouponInput) => {
    setLoading(true);
    setError(null);
    try {
      const newCoupon = await CouponService.createCoupon(input);
      setCoupons((prev) => [newCoupon, ...prev]);
      return { success: true, coupon: newCoupon };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCoupon = useCallback(async (id: string, input: Partial<CouponInput>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCoupon = await CouponService.updateCoupon(id, input);
      setCoupons((prev) => prev.map((c) => (c.id === id ? updatedCoupon : c)));
      return { success: true, coupon: updatedCoupon };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCoupon = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await CouponService.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateCoupon = useCallback(async (title: string) => {
    try {
      const coupon = await CouponService.validateCouponByTitle(title);
      if (coupon) {
        return { success: true, coupon };
      }
      return { success: false, error: 'Coupon invalide ou expiré' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erreur de validation' };
    }
  }, []);

  return {
    coupons,
    loading,
    error,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
  };
}

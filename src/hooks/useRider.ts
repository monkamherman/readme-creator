import { useState, useCallback, useEffect } from 'react';
import { RiderService, type RiderLoginResult } from '@/lib/services/rider.service';
import type { Rider, RiderOrder } from '@/lib/types/database.types';

export function useRider() {
  const [rider, setRider] = useState<Rider | null>(null);
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const riderLogin = useCallback(async (timeZone?: string, notificationToken?: string): Promise<RiderLoginResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await RiderService.riderLogin({ timeZone, notificationToken });
      if (result) {
        // Refresh rider profile after login
        const profile = await RiderService.getRiderProfile();
        setRider(profile);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!rider) {
      setError('Vous devez être connecté en tant que livreur');
      return false;
    }
    try {
      const success = await RiderService.updateRiderLocation(rider.id, latitude, longitude);
      if (success) {
        setRider((prev) => prev ? { ...prev, latitude, longitude } : null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour de la position');
      return false;
    }
  }, [rider]);

  const assignOrder = useCallback(async (orderId: string, riderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const assignmentId = await RiderService.assignOrder(orderId, riderId);
      return { success: true, assignmentId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur d\'assignation';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const pickupOrder = useCallback(async (assignmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await RiderService.pickupOrder(assignmentId);
      if (success) {
        setOrders((prev) => prev.map((o) => 
          o.id === assignmentId ? { ...o, status: 'picked_up' as const, picked_up_at: new Date().toISOString() } : o
        ));
      }
      return { success };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deliverOrder = useCallback(async (assignmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await RiderService.deliverOrder(assignmentId);
      if (success) {
        setOrders((prev) => prev.map((o) => 
          o.id === assignmentId ? { ...o, status: 'delivered' as const, delivered_at: new Date().toISOString() } : o
        ));
      }
      return { success };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la livraison';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAvailability = useCallback(async (available: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await RiderService.updateAvailability(available);
      setRider(updated);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await RiderService.getRiderOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await RiderService.getRiderProfile();
      setRider(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du profil');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rider,
    orders,
    loading,
    error,
    riderLogin,
    updateLocation,
    assignOrder,
    pickupOrder,
    deliverOrder,
    updateAvailability,
    fetchOrders,
    fetchProfile,
  };
}

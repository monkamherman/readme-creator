import { useEffect, useState, useCallback } from 'react';
import { useSubscription } from '@apollo/client';
import { 
  SUBSCRIPTION_ORDER, 
  SUBSCRIPTION_ORDER_STATUS_CHANGED,
  SUBSCRIPTION_RIDER_LOCATION 
} from '@/lib/api/graphql/subscriptions';

interface OrderTrackingState {
  orderStatus: string | null;
  riderLocation: {
    coordinates: number[];
  } | null;
  riderInfo: {
    id: string;
    name: string;
    phone: string;
  } | null;
  estimatedTime: string | null;
  preparationTime: string | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseOrderTrackingOptions {
  orderId: string;
  enabled?: boolean;
}

export const useOrderTracking = ({ orderId, enabled = true }: UseOrderTrackingOptions) => {
  const [state, setState] = useState<OrderTrackingState>({
    orderStatus: null,
    riderLocation: null,
    riderInfo: null,
    estimatedTime: null,
    preparationTime: null,
    isLoading: true,
    error: null,
  });

  // Subscribe to order updates
  const { data: orderData, error: orderError } = useSubscription(SUBSCRIPTION_ORDER, {
    variables: { id: orderId },
    skip: !enabled || !orderId,
    onData: ({ data }) => {
      console.log('Order update received:', data);
    }
  });

  // Subscribe to rider location updates
  const { data: riderData, error: riderError } = useSubscription(SUBSCRIPTION_RIDER_LOCATION, {
    variables: { oderId: orderId },
    skip: !enabled || !orderId || !['PICKED', 'ON_THE_WAY'].includes(state.orderStatus || ''),
    onData: ({ data }) => {
      console.log('Rider location update received:', data);
    }
  });

  // Update state when order data changes
  useEffect(() => {
    if (orderData?.subscriptionOrder) {
      const order = orderData.subscriptionOrder;
      setState(prev => ({
        ...prev,
        orderStatus: order.orderStatus,
        estimatedTime: order.expectedTime,
        preparationTime: order.preparationTime,
        isLoading: false,
        riderInfo: order.rider ? {
          id: order.rider._id,
          name: order.rider.name,
          phone: order.rider.phone,
        } : prev.riderInfo,
        riderLocation: order.rider?.location || prev.riderLocation,
      }));
    }
  }, [orderData]);

  // Update state when rider location changes
  useEffect(() => {
    if (riderData?.subscriptionRiderLocation) {
      const update = riderData.subscriptionRiderLocation;
      setState(prev => ({
        ...prev,
        riderLocation: update.location,
        riderInfo: update.rider ? {
          id: update.rider._id,
          name: update.rider.name,
          phone: update.rider.phone,
        } : prev.riderInfo,
      }));
    }
  }, [riderData]);

  // Handle errors
  useEffect(() => {
    if (orderError || riderError) {
      setState(prev => ({
        ...prev,
        error: orderError || riderError || null,
        isLoading: false,
      }));
    }
  }, [orderError, riderError]);

  return state;
};

interface UseUserOrdersTrackingOptions {
  userId: string;
  enabled?: boolean;
}

export const useUserOrdersTracking = ({ userId, enabled = true }: UseUserOrdersTrackingOptions) => {
  const [orders, setOrders] = useState<Map<string, any>>(new Map());

  const { data, error } = useSubscription(SUBSCRIPTION_ORDER_STATUS_CHANGED, {
    variables: { userId },
    skip: !enabled || !userId,
    onData: ({ data }) => {
      console.log('User order status changed:', data);
    }
  });

  useEffect(() => {
    if (data?.orderStatusChanged) {
      const order = data.orderStatusChanged;
      setOrders(prev => {
        const newMap = new Map(prev);
        newMap.set(order._id, order);
        return newMap;
      });
    }
  }, [data]);

  const getOrderStatus = useCallback((orderId: string) => {
    return orders.get(orderId)?.orderStatus || null;
  }, [orders]);

  return {
    orders: Array.from(orders.values()),
    getOrderStatus,
    error,
  };
};

// Order status helpers
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  PICKED: 'PICKED',
  ON_THE_WAY: 'ON_THE_WAY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  PICKED: 'Récupérée',
  ON_THE_WAY: 'En route',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const getOrderStatusLabel = (status: string): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const isOrderActive = (status: string): boolean => {
  return !['DELIVERED', 'CANCELLED'].includes(status);
};

export const getOrderProgress = (status: string): number => {
  const statusOrder = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED', 'ON_THE_WAY', 'DELIVERED'];
  const index = statusOrder.indexOf(status);
  if (index === -1) return 0;
  return Math.round((index / (statusOrder.length - 1)) * 100);
};

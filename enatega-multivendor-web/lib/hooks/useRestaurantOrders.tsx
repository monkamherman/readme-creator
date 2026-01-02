import { useEffect, useState, useCallback } from 'react';
import { useSubscription } from '@apollo/client';
import { 
  SUBSCRIPTION_NEW_ORDER 
} from '@/lib/api/graphql/subscriptions';

interface NewOrderData {
  _id: string;
  oderId: string;
  orderStatus: string;
  orderAmount: number;
  user: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  deliveryAddress: {
    deliveryAddress: string;
    details: string;
    location: {
      coordinates: number[];
    } | null;
  } | null;
  items: Array<{
    _id: string;
    title: string;
    quantity: number;
    variation: {
      title: string;
      price: number;
    } | null;
  }>;
  paymentStatus: string;
  preparationTime: string | null;
  expectedTime: string | null;
}

interface UseRestaurantOrdersOptions {
  restaurantId: string;
  enabled?: boolean;
  onNewOrder?: (order: NewOrderData) => void;
}

export const useRestaurantOrders = ({ 
  restaurantId, 
  enabled = true, 
  onNewOrder 
}: UseRestaurantOrdersOptions) => {
  const [newOrders, setNewOrders] = useState<NewOrderData[]>([]);
  const [hasNewOrder, setHasNewOrder] = useState(false);

  const { data, error } = useSubscription(SUBSCRIPTION_NEW_ORDER, {
    variables: { restaurantId },
    skip: !enabled || !restaurantId,
    onData: ({ data }) => {
      console.log('New order received:', data);
      if (data?.data?.subscriptionNewOrder) {
        const order = data.data.subscriptionNewOrder;
        setNewOrders(prev => [order, ...prev]);
        setHasNewOrder(true);
        onNewOrder?.(order);
        
        // Play notification sound
        playNotificationSound();
      }
    }
  });

  const acknowledgeNewOrders = useCallback(() => {
    setHasNewOrder(false);
  }, []);

  const clearNewOrders = useCallback(() => {
    setNewOrders([]);
    setHasNewOrder(false);
  }, []);

  return {
    newOrders,
    hasNewOrder,
    acknowledgeNewOrders,
    clearNewOrders,
    error,
  };
};

// Play notification sound when new order arrives
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/new-order.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Could not play notification sound:', err));
  } catch (error) {
    console.log('Audio not supported');
  }
};

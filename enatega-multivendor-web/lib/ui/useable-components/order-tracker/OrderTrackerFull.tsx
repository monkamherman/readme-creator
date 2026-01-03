"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import { OrderTracker } from "./index";
import { OrderTrackerMap } from "./OrderTrackerMap";
import { ORDER_TRACKING } from "@/lib/api/graphql/queries/order-tracking";
import { SUBSCRIPTION_ORDER } from "@/lib/api/graphql/subscription/orders";
import { useTranslations } from "next-intl";

interface OrderTrackerFullProps {
  orderId: string;
  isMapLoaded: boolean;
  onStatusChange?: (status: string) => void;
  showMap?: boolean;
  className?: string;
}

export function OrderTrackerFull({
  orderId,
  isMapLoaded,
  onStatusChange,
  showMap = true,
  className = "",
}: OrderTrackerFullProps) {
  const t = useTranslations();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Fetch initial order details
  const { data, loading, refetch } = useQuery(ORDER_TRACKING, {
    variables: { orderDetailsId: orderId },
    fetchPolicy: "cache-and-network",
    skip: !orderId,
  });

  // Subscribe to order updates
  const { data: subscriptionData } = useSubscription(SUBSCRIPTION_ORDER, {
    variables: { id: orderId },
    skip: !orderId,
    onData: () => {
      refetch();
    },
  });

  // Update order details when data changes
  useEffect(() => {
    if (data?.orderDetails) {
      const merged = subscriptionData?.subscriptionOrder
        ? {
            ...data.orderDetails,
            orderStatus: subscriptionData.subscriptionOrder.orderStatus || data.orderDetails.orderStatus,
            rider: subscriptionData.subscriptionOrder.rider || data.orderDetails.rider,
            completionTime: subscriptionData.subscriptionOrder.completionTime || data.orderDetails.completionTime,
          }
        : data.orderDetails;
      
      setOrderDetails(merged);
    }
  }, [data, subscriptionData]);

  // Handle status change
  const handleStatusChange = useCallback((status: string) => {
    onStatusChange?.(status);
  }, [onStatusChange]);

  // Parse locations from order details
  const getRestaurantLocation = useCallback(() => {
    if (!orderDetails?.restaurant?.location?.coordinates) {
      return { lat: 0, lng: 0 };
    }
    const coords = orderDetails.restaurant.location.coordinates;
    return {
      lng: parseFloat(coords[0]),
      lat: parseFloat(coords[1]),
    };
  }, [orderDetails]);

  const getDeliveryLocation = useCallback(() => {
    if (!orderDetails?.deliveryAddress?.location?.coordinates) {
      return { lat: 0, lng: 0 };
    }
    const coords = orderDetails.deliveryAddress.location.coordinates;
    return {
      lng: parseFloat(coords[0]),
      lat: parseFloat(coords[1]),
    };
  }, [orderDetails]);

  if (loading && !orderDetails) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Skeleton for map */}
        {showMap && (
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        )}
        {/* Skeleton for tracker */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-6" />
          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded mb-4" />
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
                <div className="w-12 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          {t?.("order_not_found") || "Commande non trouvée"}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Map */}
      {showMap && (
        <OrderTrackerMap
          isLoaded={isMapLoaded}
          restaurantLocation={getRestaurantLocation()}
          deliveryLocation={getDeliveryLocation()}
          orderStatus={orderDetails.orderStatus}
          riderId={orderDetails.rider?._id}
          height="350px"
        />
      )}

      {/* Order Tracker */}
      <OrderTracker
        orderId={orderId}
        orderStatus={orderDetails.orderStatus}
        riderId={orderDetails.rider?._id}
        restaurantLocation={getRestaurantLocation()}
        deliveryLocation={getDeliveryLocation()}
        restaurantName={orderDetails.restaurant?.name}
        estimatedTime={orderDetails.expectedTime}
        preparationTime={orderDetails.preparationTime}
        onStatusChange={handleStatusChange}
      />

      {/* Order Items Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Détails de la commande
        </h4>
        
        <div className="space-y-3">
          {orderDetails.items?.map((item: any, index: number) => (
            <div
              key={item._id || index}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center gap-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.quantity}x {item.title}
                  </p>
                  {item.variation?.title && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.variation.title}
                    </p>
                  )}
                </div>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {((item.variation?.price || 0) * (item.quantity || 1)).toFixed(2)} €
              </p>
            </div>
          ))}
        </div>

        {/* Order Total */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Sous-total</span>
            <span>{(orderDetails.orderAmount - orderDetails.deliveryCharges - orderDetails.taxationAmount).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Frais de livraison</span>
            <span>{orderDetails.deliveryCharges?.toFixed(2) || "0.00"} €</span>
          </div>
          {orderDetails.taxationAmount > 0 && (
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Taxes</span>
              <span>{orderDetails.taxationAmount?.toFixed(2)} €</span>
            </div>
          )}
          {orderDetails.tipping > 0 && (
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Pourboire</span>
              <span>{orderDetails.tipping?.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span>{orderDetails.paidAmount?.toFixed(2) || orderDetails.orderAmount?.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Adresse de livraison
        </h4>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-color/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-900 dark:text-white">
              {orderDetails.deliveryAddress?.deliveryAddress || "Adresse non disponible"}
            </p>
            {orderDetails.instructions && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Note: {orderDetails.instructions}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderTrackerFull;

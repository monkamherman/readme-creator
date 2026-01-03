"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSubscription } from "@apollo/client";
import { SUBSCRIPTION_ORDER } from "@/lib/api/graphql/subscription/orders";
import { SUBSCRIPTION_RIDER_LOCATION } from "@/lib/api/graphql/subscription/riderLocation";
import { useTranslations } from "next-intl";

// Types
interface OrderTrackerProps {
  orderId: string;
  orderStatus: string;
  riderId?: string | null;
  restaurantLocation?: {
    lat: number;
    lng: number;
  };
  deliveryLocation?: {
    lat: number;
    lng: number;
  };
  restaurantName?: string;
  estimatedTime?: string;
  preparationTime?: string;
  onStatusChange?: (status: string) => void;
  className?: string;
}

interface RiderLocation {
  lat: number;
  lng: number;
}

// Order status configuration
const ORDER_STATUSES = [
  { key: "PENDING", icon: "clock", color: "orange" },
  { key: "ACCEPTED", icon: "check", color: "blue" },
  { key: "ASSIGNED", icon: "user", color: "purple" },
  { key: "PICKED", icon: "truck", color: "green" },
  { key: "DELIVERED", icon: "home", color: "primary" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de confirmation",
  ACCEPTED: "Commande acceptée",
  ASSIGNED: "Livreur assigné",
  PICKED: "En cours de livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export function OrderTracker({
  orderId,
  orderStatus: initialStatus,
  riderId,
  restaurantLocation,
  deliveryLocation,
  restaurantName,
  estimatedTime,
  preparationTime,
  onStatusChange,
  className = "",
}: OrderTrackerProps) {
  const t = useTranslations();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAnimating, setIsAnimating] = useState(false);

  // Subscribe to order updates
  const { data: orderData } = useSubscription(SUBSCRIPTION_ORDER, {
    variables: { id: orderId },
    skip: !orderId,
    onData: ({ data }) => {
      if (data?.data?.subscriptionOrder) {
        const newStatus = data.data.subscriptionOrder.orderStatus;
        if (newStatus !== currentStatus) {
          setIsAnimating(true);
          setCurrentStatus(newStatus);
          setLastUpdate(new Date());
          onStatusChange?.(newStatus);
          
          // Play notification sound on status change
          playStatusChangeSound(newStatus);
          
          setTimeout(() => setIsAnimating(false), 1000);
        }
      }
    },
  });

  // Subscribe to rider location updates
  const { data: riderData } = useSubscription(SUBSCRIPTION_RIDER_LOCATION, {
    variables: { riderId: riderId },
    skip: !riderId || !["PICKED", "ASSIGNED"].includes(currentStatus),
    onData: ({ data }) => {
      if (data?.data?.subscriptionRiderLocation?.location?.coordinates) {
        const coords = data.data.subscriptionRiderLocation.location.coordinates;
        setRiderLocation({
          lng: parseFloat(coords[0]),
          lat: parseFloat(coords[1]),
        });
        setLastUpdate(new Date());
      }
    },
  });

  // Play sound on status change
  const playStatusChangeSound = useCallback((status: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sounds for different statuses
      const frequencies: Record<string, number> = {
        ACCEPTED: 523.25, // C5
        ASSIGNED: 587.33, // D5
        PICKED: 659.25, // E5
        DELIVERED: 783.99, // G5
      };
      
      oscillator.frequency.value = frequencies[status] || 440;
      oscillator.type = "sine";
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log("Audio notification not available");
    }
  }, []);

  // Get current step index
  const currentStepIndex = useMemo(() => {
    if (currentStatus === "CANCELLED") return -1;
    return ORDER_STATUSES.findIndex((s) => s.key === currentStatus);
  }, [currentStatus]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (currentStatus === "CANCELLED") return 0;
    if (currentStatus === "DELIVERED") return 100;
    const index = currentStepIndex;
    if (index === -1) return 0;
    return Math.round((index / (ORDER_STATUSES.length - 1)) * 100);
  }, [currentStatus, currentStepIndex]);

  // Get estimated delivery time display
  const getEstimatedTimeDisplay = useCallback(() => {
    if (currentStatus === "DELIVERED") return "Livrée";
    if (currentStatus === "CANCELLED") return "Annulée";
    if (estimatedTime) {
      const date = new Date(estimatedTime);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (preparationTime) {
      const prepDate = new Date(preparationTime);
      const now = new Date();
      const diffMs = prepDate.getTime() - now.getTime();
      const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
      return `${diffMins} min`;
    }
    return "20-30 min";
  }, [currentStatus, estimatedTime, preparationTime]);

  // Update status from props
  useEffect(() => {
    if (initialStatus !== currentStatus) {
      setCurrentStatus(initialStatus);
    }
  }, [initialStatus]);

  return (
    <div className={`order-tracker bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Suivi de commande
          </h3>
          {restaurantName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {restaurantName}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-color dark:text-primary-light">
            {getEstimatedTimeDisplay()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentStatus === "DELIVERED" ? "Heure de livraison" : "Temps estimé"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-primary-color to-primary-light rounded-full transition-all duration-1000 ease-out ${
              isAnimating ? "animate-pulse" : ""
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-3">
          {ORDER_STATUSES.map((status, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            const isCancelled = currentStatus === "CANCELLED";

            return (
              <div
                key={status.key}
                className={`flex flex-col items-center transition-all duration-500 ${
                  isActive && !isCancelled ? "scale-110" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                    isCancelled
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400"
                      : isCompleted
                      ? "bg-primary-color text-white"
                      : isActive
                      ? "bg-primary-color text-white ring-4 ring-primary-light/30 animate-pulse"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <StatusIcon type={status.icon} />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs text-center max-w-16 transition-all duration-300 ${
                    isActive && !isCancelled
                      ? "text-primary-color font-semibold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {STATUS_LABELS[status.key]?.split(" ")[0] || status.key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Message */}
      <div
        className={`p-4 rounded-lg transition-all duration-500 ${
          currentStatus === "CANCELLED"
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            : currentStatus === "DELIVERED"
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-primary-light/10 dark:bg-primary-color/10 border border-primary-light/30"
        } ${isAnimating ? "animate-bounce" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStatus === "CANCELLED"
                ? "bg-red-100 dark:bg-red-900"
                : currentStatus === "DELIVERED"
                ? "bg-green-100 dark:bg-green-900"
                : "bg-primary-light/30"
            }`}
          >
            <CurrentStatusIcon status={currentStatus} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {STATUS_LABELS[currentStatus] || currentStatus}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          {["PICKED", "ASSIGNED", "ACCEPTED", "PENDING"].includes(currentStatus) && (
            <div className="ml-auto flex items-center gap-2 text-primary-color">
              <span className="w-2 h-2 bg-primary-color rounded-full animate-ping" />
              <span className="text-sm font-medium">En direct</span>
            </div>
          )}
        </div>
      </div>

      {/* Rider Info (when applicable) */}
      {riderId && ["PICKED", "ASSIGNED"].includes(currentStatus) && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-color/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-color"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                Votre livreur est en route
              </p>
              {riderLocation && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Position mise à jour en temps réel
                </p>
              )}
            </div>
            <button className="p-2 bg-primary-color text-white rounded-full hover:bg-primary-color/90 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Status Icons
function StatusIcon({ type }: { type: string }) {
  switch (type) {
    case "clock":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "check":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "user":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      );
    case "truck":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
        </svg>
      );
    case "home":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      );
    default:
      return null;
  }
}

function CurrentStatusIcon({ status }: { status: string }) {
  const iconClass = "w-5 h-5";
  
  switch (status) {
    case "CANCELLED":
      return (
        <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "DELIVERED":
      return (
        <svg className={`${iconClass} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "PICKED":
      return (
        <svg className={`${iconClass} text-primary-color`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
        </svg>
      );
    default:
      return (
        <svg className={`${iconClass} text-primary-color`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

export default OrderTracker;

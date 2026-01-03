"use client";

import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from "react";

// Types for notification system
interface OrderNotification {
  id: string;
  type: "status_change" | "rider_assigned" | "order_picked" | "order_delivered" | "order_cancelled";
  title: string;
  message: string;
  orderId: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  playSound: (type: OrderNotification["type"]) => void;
  addNotification: (notification: Omit<OrderNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Sound frequencies for different notification types
const NOTIFICATION_SOUNDS: Record<OrderNotification["type"], { frequency: number; duration: number; pattern: number[] }> = {
  status_change: { frequency: 440, duration: 200, pattern: [1] },
  rider_assigned: { frequency: 523.25, duration: 150, pattern: [1, 0.5, 1] },
  order_picked: { frequency: 587.33, duration: 150, pattern: [1, 0.3, 1, 0.3, 1] },
  order_delivered: { frequency: 783.99, duration: 300, pattern: [1, 0.5, 1.5] },
  order_cancelled: { frequency: 349.23, duration: 400, pattern: [1] },
};

// Notification messages mapping
const NOTIFICATION_MESSAGES: Record<string, { title: string; message: string; type: OrderNotification["type"] }> = {
  PENDING: { title: "Commande en attente", message: "Votre commande est en attente de confirmation", type: "status_change" },
  ACCEPTED: { title: "Commande acceptée", message: "Le restaurant a accepté votre commande", type: "status_change" },
  ASSIGNED: { title: "Livreur assigné", message: "Un livreur a été assigné à votre commande", type: "rider_assigned" },
  PICKED: { title: "Commande récupérée", message: "Votre commande est en route vers vous", type: "order_picked" },
  DELIVERED: { title: "Commande livrée", message: "Votre commande a été livrée avec succès", type: "order_delivered" },
  CANCELLED: { title: "Commande annulée", message: "Votre commande a été annulée", type: "order_cancelled" },
};

export function OrderNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play notification sound
  const playSound = useCallback((type: OrderNotification["type"]) => {
    try {
      const audioContext = getAudioContext();
      const config = NOTIFICATION_SOUNDS[type];
      
      let startTime = audioContext.currentTime;
      
      config.pattern.forEach((multiplier, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = "sine";
        oscillator.frequency.value = config.frequency * (1 + index * 0.1);
        
        // Envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + (config.duration * multiplier) / 1000);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + (config.duration * multiplier) / 1000);
        
        startTime += (config.duration * multiplier) / 1000 + 0.05;
      });
    } catch (error) {
      console.log("Audio notification not available:", error);
    }
  }, [getAudioContext]);

  // Add notification
  const addNotification = useCallback((notification: Omit<OrderNotification, "id" | "timestamp" | "read">) => {
    const newNotification: OrderNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    
    // Play sound
    playSound(notification.type);
    
    // Show browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.orderId,
      });
    }
  }, [playSound]);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        playSound,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useOrderNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useOrderNotifications must be used within OrderNotificationProvider");
  }
  return context;
}

// Hook to create notification from order status change
export function useOrderStatusNotification(orderId: string) {
  const { addNotification } = useOrderNotifications();
  
  const notifyStatusChange = useCallback((status: string, previousStatus?: string) => {
    // Don't notify if status hasn't changed
    if (status === previousStatus) return;
    
    const notificationConfig = NOTIFICATION_MESSAGES[status];
    if (!notificationConfig) return;
    
    addNotification({
      orderId,
      ...notificationConfig,
    });
  }, [orderId, addNotification]);
  
  return { notifyStatusChange };
}

// Notification Bell Component
export function NotificationBell({ onClick }: { onClick?: () => void }) {
  const { unreadCount } = useOrderNotifications();
  
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} non lues)` : ""}`}
    >
      <svg
        className="w-6 h-6 text-gray-600 dark:text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

// Notification List Component
export function NotificationList({ onClose }: { onClose?: () => void }) {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useOrderNotifications();
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString();
  };
  
  const getTypeIcon = (type: OrderNotification["type"]) => {
    switch (type) {
      case "rider_assigned":
        return (
          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case "order_picked":
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
        );
      case "order_delivered":
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "order_cancelled":
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden max-w-md w-full max-h-96 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary-color hover:underline"
          >
            Tout marquer lu
          </button>
          <button
            onClick={clearNotifications}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Effacer
          </button>
        </div>
      </div>
      
      {/* Notification List */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>Aucune notification</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                !notification.read ? "bg-primary-color/5" : ""
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium truncate ${!notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary-color rounded-full flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default {
  OrderNotificationProvider,
  useOrderNotifications,
  useOrderStatusNotification,
  NotificationBell,
  NotificationList,
};

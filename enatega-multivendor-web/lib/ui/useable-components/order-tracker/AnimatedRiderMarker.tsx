"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Marker, Polyline } from "@react-google-maps/api";
import { useSubscription } from "@apollo/client";
import { SUBSCRIPTION_RIDER_LOCATION } from "@/lib/api/graphql/subscription/riderLocation";

interface RiderPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

interface AnimatedRiderMarkerProps {
  riderId: string;
  onPositionUpdate?: (position: { lat: number; lng: number }) => void;
  showTrail?: boolean;
  trailColor?: string;
  markerSize?: number;
}

// Custom rider marker with animation
const RIDER_MARKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#6366F1" filter="url(#shadow)"/>
  <circle cx="32" cy="32" r="24" fill="#818CF8"/>
  <circle cx="32" cy="32" r="20" fill="#6366F1"/>
  <!-- Rider icon -->
  <circle cx="32" cy="22" r="5" fill="white"/>
  <path d="M24 44a6 6 0 1 1 0-1M40 44a6 6 0 1 1 0-1" stroke="white" stroke-width="2.5" fill="none"/>
  <path d="M27 38h10M32 28v8M28 36l-3 6M36 36l3 6" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>
`;

const RIDER_MARKER = `data:image/svg+xml;base64,${btoa(RIDER_MARKER_SVG)}`;

// Pulsing marker for live tracking
const PULSE_MARKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <circle cx="40" cy="40" r="35" fill="rgba(99, 102, 241, 0.2)">
    <animate attributeName="r" values="25;35;25" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="40" cy="40" r="25" fill="rgba(99, 102, 241, 0.4)">
    <animate attributeName="r" values="20;25;20" dur="1.5s" repeatCount="indefinite"/>
  </circle>
</svg>
`;

const PULSE_MARKER = `data:image/svg+xml;base64,${btoa(PULSE_MARKER_SVG)}`;

export function AnimatedRiderMarker({
  riderId,
  onPositionUpdate,
  showTrail = true,
  trailColor = "#6366F1",
  markerSize = 48,
}: AnimatedRiderMarkerProps) {
  const [currentPosition, setCurrentPosition] = useState<RiderPosition | null>(null);
  const [targetPosition, setTargetPosition] = useState<RiderPosition | null>(null);
  const [positionHistory, setPositionHistory] = useState<RiderPosition[]>([]);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Subscribe to rider location
  const { data } = useSubscription(SUBSCRIPTION_RIDER_LOCATION, {
    variables: { riderId },
    skip: !riderId,
    onData: ({ data: subData }) => {
      if (subData?.data?.subscriptionRiderLocation?.location?.coordinates) {
        const coords = subData.data.subscriptionRiderLocation.location.coordinates;
        const newPosition: RiderPosition = {
          lng: parseFloat(coords[0]),
          lat: parseFloat(coords[1]),
          timestamp: Date.now(),
        };

        // Calculate rotation based on movement direction
        if (currentPosition) {
          const deltaLng = newPosition.lng - currentPosition.lng;
          const deltaLat = newPosition.lat - currentPosition.lat;
          const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
          setRotation(angle);
        }

        setTargetPosition(newPosition);
        lastUpdateRef.current = Date.now();
      }
    },
  });

  // Smooth animation between positions
  const animatePosition = useCallback(() => {
    if (!targetPosition) return;

    if (!currentPosition) {
      setCurrentPosition(targetPosition);
      setPositionHistory([targetPosition]);
      onPositionUpdate?.({ lat: targetPosition.lat, lng: targetPosition.lng });
      return;
    }

    const duration = 1000; // Animation duration in ms
    const elapsed = Date.now() - lastUpdateRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation
    const easeOutQuad = (t: number) => t * (2 - t);
    const easedProgress = easeOutQuad(progress);

    const interpolatedPosition: RiderPosition = {
      lat: currentPosition.lat + (targetPosition.lat - currentPosition.lat) * easedProgress,
      lng: currentPosition.lng + (targetPosition.lng - currentPosition.lng) * easedProgress,
      timestamp: Date.now(),
    };

    if (progress < 1) {
      setCurrentPosition(interpolatedPosition);
      animationRef.current = requestAnimationFrame(animatePosition);
    } else {
      setCurrentPosition(targetPosition);
      
      // Add to history
      setPositionHistory((prev) => {
        const updated = [...prev, targetPosition];
        // Keep only last 100 points
        return updated.slice(-100);
      });
      
      onPositionUpdate?.({ lat: targetPosition.lat, lng: targetPosition.lng });
    }
  }, [currentPosition, targetPosition, onPositionUpdate]);

  // Start animation when target changes
  useEffect(() => {
    if (targetPosition) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animatePosition);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPosition, animatePosition]);

  if (!currentPosition) return null;

  return (
    <>
      {/* Trail/Path */}
      {showTrail && positionHistory.length > 1 && (
        <Polyline
          path={positionHistory.map((p) => ({ lat: p.lat, lng: p.lng }))}
          options={{
            strokeColor: trailColor,
            strokeOpacity: 0.5,
            strokeWeight: 4,
            geodesic: true,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  scale: 3,
                },
                offset: "0",
                repeat: "15px",
              },
            ],
          }}
        />
      )}

      {/* Pulse effect behind marker */}
      <Marker
        position={{ lat: currentPosition.lat, lng: currentPosition.lng }}
        icon={{
          url: PULSE_MARKER,
          scaledSize: new window.google.maps.Size(markerSize * 1.5, markerSize * 1.5),
          anchor: new window.google.maps.Point(markerSize * 0.75, markerSize * 0.75),
        }}
        zIndex={999}
      />

      {/* Main rider marker */}
      <Marker
        position={{ lat: currentPosition.lat, lng: currentPosition.lng }}
        icon={{
          url: RIDER_MARKER,
          scaledSize: new window.google.maps.Size(markerSize, markerSize),
          anchor: new window.google.maps.Point(markerSize / 2, markerSize / 2),
          rotation: rotation,
        }}
        title="Livreur en route"
        zIndex={1000}
      />
    </>
  );
}

// Hook for using rider tracking in other components
export function useRiderTracking(riderId: string | null | undefined) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data } = useSubscription(SUBSCRIPTION_RIDER_LOCATION, {
    variables: { riderId },
    skip: !riderId,
    onData: ({ data: subData }) => {
      if (subData?.data?.subscriptionRiderLocation?.location?.coordinates) {
        const coords = subData.data.subscriptionRiderLocation.location.coordinates;
        setPosition({
          lng: parseFloat(coords[0]),
          lat: parseFloat(coords[1]),
        });
        setIsOnline(true);
        setLastUpdate(new Date());

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set rider offline if no update in 30 seconds
        timeoutRef.current = setTimeout(() => {
          setIsOnline(false);
        }, 30000);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    position,
    isOnline,
    lastUpdate,
  };
}

export default AnimatedRiderMarker;

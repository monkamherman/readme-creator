"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  DirectionsService,
  Polyline,
} from "@react-google-maps/api";
import { useSubscription } from "@apollo/client";
import { SUBSCRIPTION_RIDER_LOCATION } from "@/lib/api/graphql/subscription/riderLocation";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { darkMapStyle } from "@/lib/utils/mapStyles/mapStyle";

// Assets - using base64 inline SVGs for markers
const RESTAURANT_MARKER = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <circle cx="24" cy="24" r="20" fill="#FF6B35" stroke="#fff" stroke-width="3"/>
  <path d="M16 18v12h3v-5h2l2 5h3l-2.5-5.5c1.5-.8 2.5-2.4 2.5-4.5 0-3-2-5.5-5-5.5h-5zm3 2h2c1.7 0 2 1.3 2 2.5s-.3 2.5-2 2.5h-2v-5z" fill="#fff"/>
</svg>
`)}`;

const HOME_MARKER = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <circle cx="24" cy="24" r="20" fill="#5AC12F" stroke="#fff" stroke-width="3"/>
  <path d="M24 14l-10 9h3v9h5v-6h4v6h5v-9h3l-10-9z" fill="#fff"/>
</svg>
`)}`;

const RIDER_MARKER = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <circle cx="24" cy="24" r="20" fill="#6366F1" stroke="#fff" stroke-width="3"/>
  <circle cx="16" cy="30" r="4" fill="none" stroke="#fff" stroke-width="2"/>
  <circle cx="32" cy="30" r="4" fill="none" stroke="#fff" stroke-width="2"/>
  <path d="M20 30h8M24 18v8M20 26l-2 4M28 26l2 4" stroke="#fff" stroke-width="2" fill="none"/>
  <circle cx="24" cy="16" r="3" fill="#fff"/>
</svg>
`)}`;

interface OrderTrackerMapProps {
  isLoaded: boolean;
  restaurantLocation: {
    lat: number;
    lng: number;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
  };
  orderStatus: string;
  riderId?: string | null;
  height?: string;
  showDirections?: boolean;
  className?: string;
}

interface RiderPosition {
  lat: number;
  lng: number;
}

export function OrderTrackerMap({
  isLoaded,
  restaurantLocation,
  deliveryLocation,
  orderStatus,
  riderId,
  height = "400px",
  showDirections = true,
  className = "",
}: OrderTrackerMapProps) {
  const { theme } = useTheme();
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [riderPosition, setRiderPosition] = useState<RiderPosition | null>(null);
  const [riderPath, setRiderPath] = useState<RiderPosition[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRequested = useRef(false);

  // Track if rider should be shown
  const showRider = ["PICKED", "ASSIGNED"].includes(orderStatus) && riderId;
  const showRestaurant = ["PENDING", "ACCEPTED", "ASSIGNED"].includes(orderStatus);

  // Subscribe to rider location
  const { data: riderData } = useSubscription(SUBSCRIPTION_RIDER_LOCATION, {
    variables: { riderId },
    skip: !showRider,
    onData: ({ data }) => {
      if (data?.data?.subscriptionRiderLocation?.location?.coordinates) {
        const coords = data.data.subscriptionRiderLocation.location.coordinates;
        const newPosition = {
          lng: parseFloat(coords[0]),
          lat: parseFloat(coords[1]),
        };
        
        setRiderPosition(newPosition);
        setRiderPath((prev) => {
          const updated = [...prev, newPosition];
          // Keep only last 50 points for performance
          return updated.slice(-50);
        });
      }
    },
  });

  // Handle directions callback
  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === "OK" && result) {
        setDirections(result);
        directionsRequested.current = true;
      }
    },
    []
  );

  // Calculate map center based on current state
  const getMapCenter = useCallback(() => {
    if (showRider && riderPosition) {
      return riderPosition;
    }
    if (showRestaurant) {
      return restaurantLocation;
    }
    return deliveryLocation;
  }, [showRider, riderPosition, showRestaurant, restaurantLocation, deliveryLocation]);

  // Fit bounds when map loads or positions change
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(restaurantLocation);
    bounds.extend(deliveryLocation);
    if (riderPosition) {
      bounds.extend(riderPosition);
    }
    map.fitBounds(bounds, { padding: 50 });
  }, [restaurantLocation, deliveryLocation, riderPosition]);

  // Update map bounds when rider moves
  useEffect(() => {
    if (mapRef.current && riderPosition && showRider) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(riderPosition);
      bounds.extend(deliveryLocation);
      mapRef.current.fitBounds(bounds, { padding: 100 });
    }
  }, [riderPosition, deliveryLocation, showRider]);

  // Get directions origin based on status
  const getDirectionsOrigin = useCallback(() => {
    if (showRider && riderPosition) {
      return riderPosition;
    }
    return restaurantLocation;
  }, [showRider, riderPosition, restaurantLocation]);

  if (!isLoaded) {
    return (
      <div 
        className={`relative bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-color border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 dark:text-gray-400">Chargement de la carte...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={getMapCenter()}
        zoom={14}
        options={{
          styles: theme === "dark" ? darkMapStyle : null,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
        onLoad={onMapLoad}
      >
        {/* Restaurant Marker */}
        {showRestaurant && (
          <Marker
            position={restaurantLocation}
            icon={{
              url: RESTAURANT_MARKER,
              scaledSize: new window.google.maps.Size(48, 48),
              anchor: new window.google.maps.Point(24, 24),
            }}
            title="Restaurant"
          />
        )}

        {/* Home/Delivery Marker */}
        <Marker
          position={deliveryLocation}
          icon={{
            url: HOME_MARKER,
            scaledSize: new window.google.maps.Size(48, 48),
            anchor: new window.google.maps.Point(24, 24),
          }}
          title="Adresse de livraison"
        />

        {/* Rider Marker with animation */}
        {showRider && riderPosition && (
          <>
            <Marker
              position={riderPosition}
              icon={{
                url: RIDER_MARKER,
                scaledSize: new window.google.maps.Size(48, 48),
                anchor: new window.google.maps.Point(24, 24),
              }}
              title="Livreur"
              animation={window.google.maps.Animation.BOUNCE}
            />
            
            {/* Rider path trail */}
            {riderPath.length > 1 && (
              <Polyline
                path={riderPath}
                options={{
                  strokeColor: "#6366F1",
                  strokeOpacity: 0.6,
                  strokeWeight: 4,
                  geodesic: true,
                }}
              />
            )}
          </>
        )}

        {/* Directions */}
        {showDirections && !directions && !directionsRequested.current && (
          <DirectionsService
            options={{
              destination: deliveryLocation,
              origin: getDirectionsOrigin(),
              travelMode: google.maps.TravelMode.DRIVING,
            }}
            callback={directionsCallback}
          />
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#5AC12F",
                strokeOpacity: 0.8,
                strokeWeight: 5,
                zIndex: 10,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm">
        <div className="flex flex-col gap-2">
          {showRestaurant && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-gray-700 dark:text-gray-300">Restaurant</span>
            </div>
          )}
          {showRider && riderPosition && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300">Livreur</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-gray-700 dark:text-gray-300">Votre adresse</span>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      {showRider && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full shadow-lg px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">En direct</span>
        </div>
      )}
    </div>
  );
}

export default OrderTrackerMap;

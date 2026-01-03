"use client";

// Components
import { PaddingContainer } from "@/lib/ui/useable-components/containers";
import GoogleMapTrackingComponent from "@/lib/ui/screen-components/protected/order-tracking/components/gm-tracking-comp";
import TrackingOrderDetails from "../../../../screen-components/protected/order-tracking/components/tracking-order-details";
import TrackingHelpCard from "../../../../screen-components/protected/order-tracking/components/tracking-help-card";
import TrackingStatusCard from "@/lib/ui/screen-components/protected/order-tracking/components/tracking-status-card";
import TrackingOrderDetailsDummy from "../../../../screen-components/protected/order-tracking/components/tracking-order-details-dummy";

// New OrderTracker components
import { OrderTracker } from "@/lib/ui/useable-components/order-tracker";
import { OrderTrackerMap } from "@/lib/ui/useable-components/order-tracker/OrderTrackerMap";
import { ChatContainer } from "@/lib/ui/useable-components/order-tracker/RealTimeChat";
import { OrderNotificationProvider, useOrderStatusNotification } from "@/lib/ui/useable-components/order-tracker/OrderNotifications";

// Services
import useLocation from "@/lib/ui/screen-components/protected/order-tracking/services/useLocation";
import useTracking from "@/lib/ui/screen-components/protected/order-tracking/services/useTracking";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { ADD_REVIEW_ORDER, GET_USER_PROFILE } from "@/lib/api/graphql";
import useReviews from "@/lib/hooks/useReviews";
import { IReview } from "@/lib/utils/interfaces";
import useToast from "@/lib/hooks/useToast";
import { RatingModal } from "@/lib/ui/screen-components/protected/profile";
import { onUseLocalStorage } from "@/lib/utils/methods/local-storage";
import ReactConfetti from "react-confetti";
import { useTranslations } from "next-intl";

interface IOrderTrackingScreenProps {
  orderId: string;
}

export default function OrderTrackingScreen({
  orderId,
}: IOrderTrackingScreenProps) {
  const t = useTranslations();
  
  //states
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [useNewTracker, setUseNewTracker] = useState(true); // Toggle for new/old tracker
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  //Queries and Mutations
  const {
    isLoaded,
    origin,
    destination,
    directions,
    setDirections,
    directionsCallback,
    store_user_location_cache_key,
    isCheckingCache,
    setIsCheckingCache,
  } = useLocation();
  const {
    orderTrackingDetails,
    isOrderTrackingDetailsLoading,
    subscriptionData,
  } = useTracking({ orderId: orderId });

 

  const { showToast } = useToast();

  const { data: profile } = useQuery(GET_USER_PROFILE, {
    fetchPolicy: "cache-only",
  });

  const [mutate] = useMutation(ADD_REVIEW_ORDER, {
    onCompleted,
    onError,
  });

  function onCompleted() {
    showToast({
      type: "success",
      title: "Rating",
      message: "Rating submitted successfully",
      duration: 3000,
    });

    
    // Add a small delay before navigation
    // Use window.location for a hard redirect
    setTimeout(() => {
      window.location.href = "/profile/order-history";
    }, 1000); // Increased timeout to ensure toast has time to display
  }

  function onError() {
    showToast({
      type: "error",
      title: "Rating",
      message: "Failed to submit rating",
      duration: 3000,
    });
  }
  // Merge subscription data with order tracking details
  const mergedOrderDetails =
    orderTrackingDetails && subscriptionData ?
      {
        ...orderTrackingDetails,
        orderStatus:
          subscriptionData.orderStatus || orderTrackingDetails.orderStatus,
        rider: subscriptionData.rider || orderTrackingDetails.rider,
        completionTime:
          subscriptionData.completionTime ||
          orderTrackingDetails.completionTime,
      }
    : orderTrackingDetails;

  // Get restaurant ID for reviews query
  const restaurantId = useMemo(
    () => mergedOrderDetails?.restaurant?._id,
    [mergedOrderDetails?.restaurant?._id]
  );

  // Fetch reviews data for the specified restaurant
  const { data: reviewsData, refetch } = useReviews(restaurantId);

  // Check if the user has already reviewed the order
  // Memoize the check for existing user review
  const hasUserReview = useMemo(() => {
    if (
      !reviewsData?.reviewsByRestaurant?.reviews ||
      !profile?.profile?.email
    ) {
      return false;
    }
    return reviewsData.reviewsByRestaurant.reviews.some(
      (review: IReview) =>
        review?.order?.user?.email === profile.profile.email &&
        review?.order?._id === orderId
    );
  }, [
    reviewsData?.reviewsByRestaurant?.reviews,
    profile?.profile?.email,
    orderId,
  ]);

  // Gestionnaires
  const onInitDirectionCacheSet = () => {
    try {
      const stored_direction = onUseLocalStorage(
        "get",
        store_user_location_cache_key
      );
      if (stored_direction) {
        setDirections(JSON.parse(stored_direction));
      }
      setIsCheckingCache(false); // done checking
    } catch (err) {
      setIsCheckingCache(false);
    } finally {
      setIsCheckingCache(false);
    }
  };

  // handle submit rating
  const handleSubmitRating = async (
    orderId: string | undefined,
    ratingValue: number,
    comment?: string,
    aspects: string[] = []
  ) => {
    const reviewDescription = comment?.trim() || undefined;
    const reviewComments =
      aspects?.filter(Boolean).join(", ") || undefined;

    // Here you would  call an API to save the rating
    try {
      await mutate({
        variables: {
          order: orderId,
          description: reviewDescription,
          rating: ratingValue,
          comments: reviewComments,
        },
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
    }

    // Close the modal
    setShowRatingModal(false);
  };

  //useEffects

  // useEffect to handle order status changes
  useEffect(() => {
     if(mergedOrderDetails?.orderStatus == 'PICKED' )
     {
       setShowChat(true)
     }

    if (mergedOrderDetails?.orderStatus == "DELIVERED") {
      // add timer
      const timer = setTimeout(() => {
        setShowRatingModal(true);
      }, 4000); // 4 seconds delay before showing the modal
      return () => clearTimeout(timer); // Clear timeout on component unmount
    }else if (mergedOrderDetails?.orderStatus == "ACCEPTED") {
        setShowConfetti(true);

        // Reset confetti after a longer delay
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
    }
  }, [mergedOrderDetails?.orderStatus]);

  // useEffect to handle subscription data changes
  useEffect(() => {
    if (mergedOrderDetails?.restaurant?._id) {
      refetch();
    }
  }, [mergedOrderDetails?.restaurant?._id, isOrderTrackingDetailsLoading]);

  useEffect(() => {
    onInitDirectionCacheSet();
  }, [store_user_location_cache_key]);

  // Get location data for new tracker
  const getRestaurantLocation = useCallback(() => {
    if (!mergedOrderDetails?.restaurant?.location?.coordinates) {
      return origin;
    }
    const coords = mergedOrderDetails.restaurant.location.coordinates;
    return {
      lng: parseFloat(coords[0]),
      lat: parseFloat(coords[1]),
    };
  }, [mergedOrderDetails, origin]);

  const getDeliveryLocation = useCallback(() => {
    if (!mergedOrderDetails?.deliveryAddress?.location?.coordinates) {
      return destination;
    }
    const coords = mergedOrderDetails.deliveryAddress.location.coordinates;
    return {
      lng: parseFloat(coords[0]),
      lat: parseFloat(coords[1]),
    };
  }, [mergedOrderDetails, destination]);

  // Handle status change for notifications
  const handleStatusChange = useCallback((newStatus: string) => {
    if (previousStatus && newStatus !== previousStatus) {
      // Play notification sound and show browser notification
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const frequencies: Record<string, number> = {
          ACCEPTED: 523.25,
          ASSIGNED: 587.33,
          PICKED: 659.25,
          DELIVERED: 783.99,
        };
        
        oscillator.frequency.value = frequencies[newStatus] || 440;
        oscillator.type = "sine";
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.log("Audio not available");
      }
    }
    setPreviousStatus(newStatus);
  }, [previousStatus]);

  console.log("data ", mergedOrderDetails);
  
  return (
    <OrderNotificationProvider>
      {showConfetti && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          <ReactConfetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={1000}
            gravity={0.3}
          />
        </div>
      )}
      
      <RatingModal
        visible={showRatingModal && !hasUserReview}
        onHide={() => setShowRatingModal(false)}
        order={orderTrackingDetails}
        onSubmitRating={handleSubmitRating}
      />
      
      <div className="w-screen h-full flex flex-col pb-20 dark:bg-gray-900 dark:text-gray-100">
        <div className="scrollable-container flex-1">
          {/* New OrderTracker with Map */}
          {useNewTracker ? (
            <>
              {/* Enhanced Map with real-time rider tracking */}
              {isLoaded && mergedOrderDetails && (
                <OrderTrackerMap
                  isLoaded={isLoaded}
                  restaurantLocation={getRestaurantLocation()}
                  deliveryLocation={getDeliveryLocation()}
                  orderStatus={mergedOrderDetails?.orderStatus || "PENDING"}
                  riderId={mergedOrderDetails?.rider?._id}
                  height="350px"
                  className="rounded-none"
                />
              )}

              {/* Main Content */}
              <div className="mt-6 md:mt-8">
                <PaddingContainer>
                  {/* New OrderTracker Component */}
                  {!isOrderTrackingDetailsLoading && mergedOrderDetails && (
                    <OrderTracker
                      orderId={orderId}
                      orderStatus={mergedOrderDetails.orderStatus}
                      riderId={mergedOrderDetails.rider?._id}
                      restaurantLocation={getRestaurantLocation()}
                      deliveryLocation={getDeliveryLocation()}
                      restaurantName={mergedOrderDetails.restaurant?.name}
                      estimatedTime={mergedOrderDetails.expectedTime}
                      preparationTime={mergedOrderDetails.preparationTime}
                      onStatusChange={handleStatusChange}
                      className="mb-6"
                    />
                  )}

                  {/* Help Card */}
                  <div className="mb-6">
                    <TrackingHelpCard />
                  </div>

                  {/* Order Details */}
                  <div className="flex justify-center md:justify-start">
                    {isOrderTrackingDetailsLoading ? (
                      <TrackingOrderDetailsDummy />
                    ) : (
                      <TrackingOrderDetails
                        orderTrackingDetails={mergedOrderDetails}
                      />
                    )}
                  </div>
                </PaddingContainer>
              </div>
            </>
          ) : (
            <>
              {/* Original Google Map */}
              <GoogleMapTrackingComponent
                isLoaded={isLoaded}
                origin={origin}
                destination={destination}
                directions={directions}
                isCheckingCache={isCheckingCache}
                directionsCallback={directionsCallback}
                orderStatus={mergedOrderDetails?.orderStatus || "PENDING"}
                riderId={mergedOrderDetails?.rider?._id}
              />

              {/* Original Content */}
              <div className="mt-8 md:mt-10">
                <PaddingContainer>
                  <div className="flex flex-col md:flex-row md:items-start items-center justify-between gap-6 mb-8">
                    {!isOrderTrackingDetailsLoading && mergedOrderDetails && (
                      <TrackingStatusCard
                        orderTrackingDetails={mergedOrderDetails}
                      />
                    )}
                    <div className="md:ml-0 w-full md:w-auto md:flex-none">
                      <TrackingHelpCard />
                    </div>
                  </div>

                  <div className="flex justify-center md:justify-start">
                    {isOrderTrackingDetailsLoading ? (
                      <TrackingOrderDetailsDummy />
                    ) : (
                      <TrackingOrderDetails
                        orderTrackingDetails={mergedOrderDetails}
                      />
                    )}
                  </div>
                </PaddingContainer>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Chat Button */}
      {showChat && profile?.profile?._id && (
        <ChatContainer
          orderId={orderId}
          currentUserId={profile.profile._id}
          currentUserName={profile.profile.name}
          enabled={showChat}
        />
      )}
    </OrderNotificationProvider>
  );
}

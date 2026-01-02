import { gql } from "@apollo/client";

// ============================================
// ORDER TRACKING SUBSCRIPTIONS
// ============================================

export const SUBSCRIPTION_ORDER = gql`
  subscription SubscriptionOrder($id: String!) {
    subscriptionOrder(id: $id) {
      _id
      oderId
      orderStatus
      rider {
        _id
        name
        phone
        location {
          coordinates
        }
      }
      completionTime
      orderAmount
      deliveryAddress {
        deliveryAddress
        details
        label
        location {
          coordinates
        }
      }
      paymentStatus
      preparationTime
      expectedTime
      isPickedUp
      acceptedAt
      pickedAt
      deliveredAt
      cancelledAt
      assignedAt
      restaurant {
        _id
        name
        image
        address
        location {
          coordinates
        }
      }
      items {
        _id
        title
        quantity
        variation {
          _id
          title
          price
        }
      }
      reason
    }
  }
`;

export const SUBSCRIPTION_ORDER_STATUS_CHANGED = gql`
  subscription OrderStatusChanged($userId: String) {
    orderStatusChanged(userId: $userId) {
      _id
      orderId
      orderStatus
      restaurant {
        _id
        name
      }
      rider {
        _id
        name
        phone
      }
      completionTime
      preparationTime
      expectedTime
      acceptedAt
      pickedAt
      deliveredAt
      cancelledAt
    }
  }
`;

// ============================================
// RESTAURANT SUBSCRIPTIONS
// ============================================

export const SUBSCRIPTION_NEW_ORDER = gql`
  subscription SubscriptionNewOrder($restaurantId: String) {
    subscriptionNewOrder(restaurantId: $restaurantId) {
      _id
      oderId
      orderStatus
      orderAmount
      user {
        _id
        name
        phone
      }
      deliveryAddress {
        deliveryAddress
        details
        location {
          coordinates
        }
      }
      items {
        _id
        title
        quantity
        variation {
          _id
          title
          price
        }
      }
      paymentStatus
      preparationTime
      expectedTime
    }
  }
`;

// ============================================
// RIDER SUBSCRIPTIONS
// ============================================

export const SUBSCRIPTION_RIDER_LOCATION = gql`
  subscription SubscriptionRiderLocation($oderId: String) {
    subscriptionRiderLocation(oderId: $oderId) {
      oderId
      rider {
        _id
        name
        phone
      }
      location {
        coordinates
      }
      heading
      timestamp
    }
  }
`;

export const SUBSCRIPTION_ASSIGN_RIDER = gql`
  subscription SubscriptionAssignRider($oderId: String) {
    subscriptionAssignRider(oderId: $oderId) {
      _id
      orderId
      orderStatus
      rider {
        _id
        name
        phone
        location {
          coordinates
        }
      }
      assignedAt
    }
  }
`;

export const SUBSCRIPTION_ZONE_ORDERS = gql`
  subscription SubscriptionZoneOrders($zoneId: String!) {
    subscriptionZoneOrders(zoneId: $zoneId) {
      _id
      orderId
      orderStatus
      restaurant {
        _id
        name
        address
        location {
          coordinates
        }
      }
      deliveryAddress {
        deliveryAddress
        location {
          coordinates
        }
      }
      orderAmount
      paymentMethod
    }
  }
`;

// ============================================
// CHAT SUBSCRIPTIONS
// ============================================

export const SUBSCRIPTION_NEW_MESSAGE = gql`
  subscription SubscriptionNewMessage($orderId: String!) {
    subscriptionNewMessage(orderId: $orderId) {
      id
      message
      user {
        id
        name
      }
      createdAt
    }
  }
`;

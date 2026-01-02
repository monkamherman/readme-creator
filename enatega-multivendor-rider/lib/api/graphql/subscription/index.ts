import { gql } from "@apollo/client";

// ============================================
// RIDER ORDER SUBSCRIPTIONS
// ============================================

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
      assignedAt
    }
  }
`;

export const SUBSCRIPTION_ORDER_STATUS = gql`
  subscription SubscriptionOrder($id: String!) {
    subscriptionOrder(id: $id) {
      _id
      oderId
      orderStatus
      completionTime
      paymentStatus
      preparationTime
      expectedTime
      isPickedUp
      acceptedAt
      pickedAt
      deliveredAt
      cancelledAt
      assignedAt
      reason
      restaurant {
        _id
        name
        address
        location {
          coordinates
        }
      }
      user {
        _id
        name
        phone
      }
    }
  }
`;

export const SUBSCRIPTION_NEW_CHAT_MESSAGE = gql`
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

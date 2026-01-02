import { gql } from "@apollo/client";

// ============================================
// STORE ORDER SUBSCRIPTIONS
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

export const SUBSCRIPTION_ORDER_STATUS = gql`
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
    }
  }
`;

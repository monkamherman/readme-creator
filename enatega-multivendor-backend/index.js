const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const WebSocket = require("ws");
require("dotenv").config();

const prisma = new PrismaClient();

// Schéma GraphQL - Phase 1: Auth Compatible
const typeDefs = `
  # ============================================
  # AUTH TYPES
  # ============================================
  
  type AuthPayload {
    userId: String
    token: String!
    tokenExpiration: Int
    name: String
    email: String
    phone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
    picture: String
    addresses: [Address]
    isNewUser: Boolean
    userTypeId: String
    isActive: Boolean
  }

  type EmailExistPayload {
    _id: String
    email: String
    userType: String
  }

  type PhoneExistPayload {
    _id: String
    phone: String
    userType: String
  }

  type OtpPayload {
    result: Boolean
  }

  # ============================================
  # NOTIFICATION TYPES
  # ============================================

  type Notification {
    _id: ID!
    userId: String!
    title: String!
    message: String!
    type: String!
    data: String
    read: Boolean!
    createdAt: String!
  }

  type DeviceToken {
    _id: ID!
    userId: String!
    token: String!
    platform: String!
    createdAt: String!
  }

  # ============================================
  # LOCATION & TIME TYPES
  # ============================================

  type Location {
    coordinates: [Float]
  }

  type OpeningTimeTimes {
    startTime: [String]
    endTime: [String]
  }

  type OpeningTime {
    day: String
    times: [OpeningTimeTimes]
  }

  # ============================================
  # RESTAURANT TYPES
  # ============================================

  type Variation {
    _id: ID!
    title: String
    price: Float
    discounted: Float
    addons: [String]
    isOutOfStock: Boolean
  }

  type Option {
    _id: ID!
    title: String
    description: String
    price: Float
    isOutOfStock: Boolean
  }

  type Addon {
    _id: ID!
    title: String
    description: String
    quantityMinimum: Int
    quantityMaximum: Int
    options: [Option]
  }

  type ReviewData {
    reviews: [Review]
    ratings: Float
    total: Int
  }

  type Owner {
    _id: ID!
    email: String
    isActive: Boolean
  }

  type DeliveryBounds {
    coordinates: [[[[Float]]]]
  }

  type RestaurantPreview {
    _id: ID!
    orderId: Int
    orderPrefix: String
    name: String
    image: String
    logo: String
    slug: String
    shopType: String
    address: String
    location: Location
    deliveryTime: Int
    minimumOrder: Float
    tax: Float
    rating: Float
    reviewAverage: Float
    reviewCount: Int
    cuisines: [String]
    isActive: Boolean
    isAvailable: Boolean
    openingTimes: [OpeningTime]
    deliveryBounds: DeliveryBounds
    zone: Zone
    distanceInKm: Float
    isWithinDeliveryZone: Boolean
    commissionRate: Float
  }

  type Restaurant {
    _id: ID!
    orderId: Int
    orderPrefix: String
    name: String
    image: String
    logo: String
    slug: String
    username: String
    password: String
    phone: String
    email: String
    shopType: String
    address: String
    location: Location
    deliveryTime: Int
    minimumOrder: Float
    tax: Float
    rating: Float
    reviewAverage: Float
    reviewCount: Int
    cuisines: [String]
    keywords: [String]
    tags: [String]
    sections: [String]
    isActive: Boolean
    isAvailable: Boolean
    openingTimes: [OpeningTime]
    categories: [Category]
    options: [Option]
    addons: [Addon]
    orders: [Order]
    reviews: [Review]
    reviewData: ReviewData
    zone: Zone
    owner: Owner
    deliveryBounds: DeliveryBounds
    stripeDetailsSubmitted: Boolean
    commissionRate: Float
    notificationToken: String
    enableNotification: Boolean
    restaurantUrl: String
    distanceInKm: Float
    isWithinDeliveryZone: Boolean
  }

  type Category {
    _id: ID!
    title: String
    restaurant: Restaurant
    foods: [Food]
    createdAt: String
    updatedAt: String
  }

  type Food {
    _id: ID!
    title: String
    image: String
    description: String
    subCategory: String
    isOutOfStock: Boolean
    isActive: Boolean
    variations: [Variation]
    category: Category
    createdAt: String
    updatedAt: String
  }

  # ============================================
  # USER TYPES
  # ============================================

  type Address {
    _id: ID
    id: String
    location: Location
    deliveryAddress: String
    address: String
    details: String
    label: String
    selected: Boolean
    user: User
  }

  type User {
    _id: ID!
    name: String
    email: String
    phone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
    password: String
    isActive: Boolean
    isOrderNotification: Boolean
    isOfferNotification: Boolean
    notificationToken: String
    favourite: [String]
    userType: String
    orders: [Order]
    reviews: [Review]
    addresses: [Address]
    createdAt: String
    updatedAt: String
  }

  # ============================================
  # RIDER TYPES
  # ============================================

  type WorkSlot {
    startTime: String
    endTime: String
  }

  type WorkSchedule {
    day: String
    enabled: Boolean
    slots: [WorkSlot]
  }

  type LicenseDetails {
    number: String
    expiryDate: String
    image: String
  }

  type VehicleDetails {
    number: String
    image: String
  }

  type BussinessDetails {
    bankName: String
    accountName: String
    accountCode: String
    accountNumber: String
  }

  type Rider {
    _id: ID!
    name: String
    username: String
    password: String
    phone: String
    email: String
    image: String
    available: Boolean
    isActive: Boolean
    vehicleType: String
    location: Location
    zone: Zone
    orders: [Order]
    currentWalletAmount: Float
    totalWalletAmount: Float
    withdrawnWalletAmount: Float
    accountNumber: String
    assigned: Boolean
    bussinessDetails: BussinessDetails
    licenseDetails: LicenseDetails
    vehicleDetails: VehicleDetails
    workSchedule: [WorkSchedule]
    timeZone: String
    createdAt: String
    updatedAt: String
  }

  type RiderLoginPayload {
    userId: String
    token: String!
  }

  type RestaurantLoginPayload {
    token: String!
    restaurantId: String
  }

  # ============================================
  # ORDER TYPES
  # ============================================

  type OrderItem {
    _id: ID
    id: String
    title: String
    food: String
    description: String
    image: String
    quantity: Int
    variation: Variation
    addons: [Addon]
    specialInstructions: String
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  type DeliveryAddress {
    _id: ID
    id: String
    location: Location
    deliveryAddress: String
    details: String
    label: String
  }

  type ChatMessage {
    user: String
    message: String
    images: [String]
    isActive: Boolean
  }

  type Order {
    _id: ID!
    orderId: String
    id: String
    restaurant: Restaurant
    user: User
    rider: Rider
    zone: Zone
    items: [OrderItem]
    deliveryAddress: DeliveryAddress
    paymentMethod: String
    paidAmount: Float
    orderAmount: Float
    orderStatus: String
    status: String
    paymentStatus: String
    reason: String
    tipping: Float
    taxationAmount: Float
    createdAt: String
    completionTime: String
    preparationTime: String
    orderDate: String
    expectedTime: String
    isPickedUp: Boolean
    deliveryCharges: Float
    instructions: String
    isActive: Boolean
    isRinged: Boolean
    isRiderRinged: Boolean
    review: Review
    chat: [ChatMessage]
    acceptedAt: String
    pickedAt: String
    deliveredAt: String
    cancelledAt: String
    assignedAt: String
  }

  type Review {
    _id: ID!
    rating: Int
    description: String
    order: Order
    restaurant: Restaurant
    user: User
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  # ============================================
  # ZONE & CONFIG TYPES
  # ============================================

  type Zone {
    _id: ID!
    title: String
    description: String
    location: Location
    coordinates: String
    tax: Float
    isActive: Boolean
    restaurants: [Restaurant]
  }

  type Configuration {
    _id: ID!
    emailUsername: String
    emailPassword: String
    currency: String
    currencySymbol: String
    deliveryRate: Float
    twilioEnabled: Boolean
    androidClientID: String
    iOSClientID: String
    appAmplitudeApiKey: String
    googleApiKey: String
    expoClientID: String
    customerAppSentryUrl: String
    termsAndConditions: String
    privacyPolicy: String
    testOtp: String
    skipMobileVerification: Boolean
    skipEmailVerification: Boolean
    costType: String
    webClientID: String
    webAmplitudeApiKey: String
    googleMapLibraries: String
    googleColor: String
    webSentryUrl: String
    publishableKey: String
    clientId: String
    firebaseKey: String
    authDomain: String
    projectId: String
    storageBucket: String
    msgSenderId: String
    appId: String
  }

  type Cuisine {
    _id: ID!
    name: String
    description: String
    image: String
    shopType: String
  }

  type Banner {
    _id: ID!
    title: String
    description: String
    action: String
    screen: String
    file: String
    parameters: String
  }

  type Tip {
    _id: ID!
    tipVariations: [Float]
    enabled: Boolean
  }

  type Tax {
    _id: ID!
    taxationCharges: Float
    enabled: Boolean
  }

  type Coupon {
    _id: ID!
    code: String
    title: String
    discount: Float
    discountType: String
    minOrderAmount: Float
    maxDiscount: Float
    enabled: Boolean
    validFrom: String
    validUntil: String
    usageLimit: Int
    usedCount: Int
  }

  type CouponResult {
    coupon: Coupon
    message: String
    success: Boolean
  }

  type LastOrderCreds {
    restaurantUsername: String
    restaurantPassword: String
    riderUsername: String
    riderPassword: String
  }

  type AppVersions {
    customerAppVersion: CustomerAppVersion
    riderAppVersion: String
    restaurantAppVersion: String
  }

  type CustomerAppVersion {
    android: String
    ios: String
  }

  # ============================================
  # QUERY TYPE
  # ============================================

  type Query {
    # Notifications
    notifications: [Notification]
    deviceTokens: [DeviceToken]
    
    # Restaurants
    restaurants: [Restaurant]
    restaurant(id: String): Restaurant
    nearByRestaurants(latitude: Float!, longitude: Float!, shopType: String, ip: String): NearByRestaurantsResult
    nearByRestaurantsPreview(latitude: Float!, longitude: Float!, shopType: String, page: Int, limit: Int): NearByRestaurantsResult
    topRatedVendors(latitude: Float!, longitude: Float!): [Restaurant]
    topRatedVendorsPreview(latitude: Float!, longitude: Float!): [Restaurant]
    mostOrderedRestaurants(latitude: Float!, longitude: Float!, shopType: String): [Restaurant]
    mostOrderedRestaurantsPreview(latitude: Float!, longitude: Float!, shopType: String): [Restaurant]
    recentOrderRestaurants(latitude: Float!, longitude: Float!): [Restaurant]
    recentOrderRestaurantsPreview(latitude: Float!, longitude: Float!): [Restaurant]
    userFavourite(latitude: Float, longitude: Float): [Restaurant]
    reviewsByRestaurant(restaurant: String!): ReviewData
    popularFoodItems(restaurantId: String!): [Food]
    relatedItems(itemId: String!, restaurantId: String!): [String]
    popularItems(restaurantId: String!): [PopularItem]
    
    # Categories & Foods
    categories: [Category]
    foods: [Food]
    subCategories: [SubCategory]
    subCategoriesByParentId(parentCategoryId: String!): [SubCategory]
    
    # Users
    users: [User]
    profile: User
    
    # Orders
    orders(offset: Int, limit: Int): [Order]
    order(id: String!): Order
    allOrders(page: Int, limit: Int): [Order]
    
    # Riders
    riders: [Rider]
    rider(id: String): Rider
    riderOrders: [Order]
    
    # Reviews
    reviews: [Review]
    
    # Zones & Config
    zones: [Zone]
    addresses: [Address]
    configuration: Configuration
    cuisines: [Cuisine]
    banners: [Banner]
    tips: Tip
    taxes: [Tax]
    
    # Coupons
    coupon(coupon: String!, restaurantId: ID!): CouponResult
    
    # App
    getVersions: AppVersions
    lastOrderCreds: LastOrderCreds
    
    # Chat
    chat(order: ID!): [ChatMessageResult]
  }

  type NearByRestaurantsResult {
    offers: [Offer]
    sections: [Section]
    restaurants: [RestaurantPreview]
    totalCount: Int
    page: Int
    limit: Int
    hasMore: Boolean
  }

  type Offer {
    _id: ID!
    name: String
    tag: String
    restaurants: [String]
  }

  type Section {
    _id: ID!
    name: String
    restaurants: [String]
  }

  type PopularItem {
    id: String
    count: Int
  }

  type SubCategory {
    _id: ID!
    title: String
    parentCategoryId: String
  }

  type ChatMessageResult {
    id: ID!
    message: String
    user: ChatUser
    createdAt: String
  }

  type ChatUser {
    id: String
    name: String
  }

  # ============================================
  # MUTATION TYPE
  # ============================================

  type Mutation {
    # =========== AUTHENTIFICATION ===========
    
    # Login complet (compatible avec tous les clients)
    login(
      type: String!
      email: String
      password: String
      name: String
      notificationToken: String
      isActive: Boolean
      appleId: String
    ): AuthPayload
    
    # Création d'utilisateur
    createUser(userInput: UserInput!): AuthPayload
    
    # Vérification existence email/phone
    emailExist(email: String!): EmailExistPayload
    phoneExist(phone: String!): PhoneExistPayload
    
    # OTP
    sendOtpToEmail(email: String!): OtpPayload
    sendOtpToPhoneNumber(phone: String!): OtpPayload
    verifyOtp(otp: String!, email: String, phone: String): OtpPayload
    
    # Mot de passe
    forgotPassword(email: String!): OtpPayload
    resetPassword(password: String!, email: String!): OtpPayload
    changePassword(oldPassword: String!, newPassword: String!): Boolean
    
    # Login Restaurant
    restaurantLogin(
      username: String!
      password: String!
      notificationToken: String
    ): RestaurantLoginPayload
    
    # Login Rider
    riderLogin(
      username: String
      password: String
      notificationToken: String
      timeZone: String!
    ): RiderLoginPayload
    
    # =========== USER ===========
    updateUser(updateUserInput: UpdateUserInput!): User
    updateNotificationStatus(offerNotification: Boolean!, orderNotification: Boolean!): User
    Deactivate(isActive: Boolean!, email: String!): User
    pushToken(token: String): User
    addFavourite(id: String!): User
    
    # =========== ADDRESSES ===========
    createAddress(addressInput: AddressInput!): User
    editAddress(addressInput: AddressInput!): User
    deleteAddress(id: ID!): User
    deleteBulkAddresses(ids: [ID!]!): User
    selectAddress(id: String!): User
    
    # =========== NOTIFICATIONS ===========
    createNotification(userId: String!, title: String!, message: String!, type: String!, data: String): Notification
    markNotificationAsRead(id: ID!): Notification
    addDeviceToken(userId: String!, token: String!, platform: String!): DeviceToken
    removeDeviceToken(id: ID!): DeviceToken
    sendNotificationToUser(userId: String!, title: String!, message: String!, type: String!): Boolean
    
    # =========== ORDERS ===========
    placeOrder(
      restaurant: String!
      orderInput: [OrderItemInput!]!
      paymentMethod: String!
      couponCode: String
      tipping: Float!
      taxationAmount: Float!
      address: AddressInput!
      orderDate: String!
      isPickedUp: Boolean!
      deliveryCharges: Float!
      instructions: String
    ): Order
    
    updateOrderStatus(orderId: ID!, status: String!): Order
    abortOrder(id: String!): Order
    reviewOrder(reviewInput: ReviewInput!): Order
    
    # Store mutations
    acceptOrder(_id: String!, time: String): Order
    cancelOrder(_id: String!, reason: String!): Order
    orderPickedUp(_id: String!): Order
    muteRing(orderId: String): Boolean
    
    # =========== RESTAURANT ===========
    createRestaurant(restaurant: RestaurantInput!, owner: ID!): Restaurant
    updateRestaurant(id: ID!, data: RestaurantInput!): Restaurant
    editRestaurant(restaurant: RestaurantProfileInput!): Restaurant
    deleteRestaurant(id: String!): Restaurant
    toggleAvailability(restaurantId: String): Restaurant
    
    # =========== CATEGORIES & FOODS ===========
    createCategory(data: CategoryInput!): Category
    createFood(data: FoodInput!): Food
    updateFoodOutOfStock(id: String!, restaurant: String!, categoryId: String!): Boolean
    
    # =========== RIDERS ===========
    createRider(data: RiderInput!): Rider
    updateRiderLocation(latitude: Float!, longitude: Float!): Rider
    
    # =========== REVIEWS ===========
    createReview(data: ReviewInput!): Review

    # =========== COUPONS ===========
    applyCoupon(coupon: String!, restaurantId: ID!): CouponResult

    # =========== CHAT ===========
    sendChatMessage(orderId: ID!, message: ChatMessageInput!): ChatSendResult
  }

  type ChatSendResult {
    success: Boolean
    message: String
    data: ChatMessageResult
  }

  # ============================================
  # INPUT TYPES
  # ============================================

  input UserInput {
    phone: String
    email: String
    password: String
    name: String
    notificationToken: String
    appleId: String
    emailIsVerified: Boolean
    isPhoneExists: Boolean
  }

  input UpdateUserInput {
    name: String!
    phone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
  }

  input AddressInput {
    _id: String
    location: LocationInput
    deliveryAddress: String
    details: String
    label: String
    selected: Boolean
  }

  input OrderItemInput {
    food: String!
    quantity: Int!
    variation: String!
    addons: [OrderAddonInput]
    specialInstructions: String
  }

  input OrderAddonInput {
    _id: String!
    options: [String]
  }

  input ChatMessageInput {
    message: String!
    user: String
  }

  input RestaurantInput {
    name: String
    image: String
    logo: String
    slug: String
    username: String
    password: String
    phone: String
    email: String
    shopType: String
    address: String
    location: LocationInput
    deliveryTime: Int
    minimumOrder: Float
    tax: Float
    cuisines: [String]
    isActive: Boolean
    isAvailable: Boolean
    orderPrefix: String
    commissionRate: Float
  }

  input RestaurantProfileInput {
    _id: String!
    name: String
    phone: String
    image: String
    logo: String
    slug: String
    address: String
    username: String
    password: String
    location: LocationInput
    isAvailable: Boolean
    minimumOrder: Float
    tax: Float
    openingTimes: [OpeningTimeInput]
    shopType: String
  }

  input OpeningTimeInput {
    day: String
    times: [OpeningTimeTimesInput]
  }

  input OpeningTimeTimesInput {
    startTime: [String]
    endTime: [String]
  }

  input LocationInput {
    coordinates: [Float]
  }

  input CategoryInput {
    title: String
    restaurantId: String
  }

  input FoodInput {
    title: String
    image: String
    description: String
    subCategory: String
    isOutOfStock: Boolean
    categoryId: String
  }

  input OrderInput {
    orderId: String
    restaurantId: String
    userId: String
    riderId: String
    items: String
    deliveryAddress: String
    paymentMethod: String
    paidAmount: Float
    orderAmount: Float
  }

  input RiderInput {
    name: String
    username: String
    password: String
    phone: String
    available: Boolean
  }

  input ReviewInput {
    order: String!
    rating: Int!
    description: String
  }
`;

const { hashPassword, comparePassword, generateToken, verifyToken } = require('./utils/auth');
const WebSocketManager = require('./utils/websocket');

const wsManager = new WebSocketManager();

// Store OTP codes temporairement (en production, utiliser Redis)
const otpStore = new Map();

// Générer un OTP à 6 chiffres
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// FONCTIONS GÉOLOCALISATION
// ============================================

/**
 * Calcule la distance en km entre deux points (formule Haversine)
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Vérifie si un point est dans un polygone (algorithme ray-casting)
 */
const isPointInPolygon = (point, polygon) => {
  if (!polygon || !polygon.length) return false;
  
  const [x, y] = point; // [lng, lat]
  let inside = false;
  
  // Gérer les polygones imbriqués (GeoJSON style)
  const coords = Array.isArray(polygon[0][0]) ? polygon[0] : polygon;
  
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0], yi = coords[i][1];
    const xj = coords[j][0], yj = coords[j][1];
    
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  
  return inside;
};

/**
 * Vérifie si un utilisateur est dans la zone de livraison d'un restaurant
 */
const isWithinDeliveryBounds = (userLat, userLng, deliveryBounds) => {
  if (!deliveryBounds?.coordinates) return false;
  
  // deliveryBounds.coordinates est un tableau de polygones
  const polygons = deliveryBounds.coordinates;
  
  // Vérifier chaque polygone
  for (const polygon of polygons) {
    if (isPointInPolygon([userLng, userLat], polygon)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Enrichit un restaurant avec les infos de distance et zone
 */
const enrichRestaurantWithGeoData = (restaurant, userLat, userLng) => {
  const restLat = restaurant.location?.coordinates?.[1];
  const restLng = restaurant.location?.coordinates?.[0];
  
  let distanceInKm = null;
  let isWithinDeliveryZone = false;
  
  if (restLat && restLng && userLat && userLng) {
    distanceInKm = calculateHaversineDistance(userLat, userLng, restLat, restLng);
    distanceInKm = Math.round(distanceInKm * 100) / 100; // Arrondir à 2 décimales
  }
  
  // Vérifier si dans la zone de livraison
  if (restaurant.deliveryBounds) {
    isWithinDeliveryZone = isWithinDeliveryBounds(userLat, userLng, restaurant.deliveryBounds);
  }
  
  return {
    ...restaurant,
    _id: restaurant.id,
    distanceInKm,
    isWithinDeliveryZone,
    rating: restaurant.reviewAverage || 0,
    reviewCount: restaurant.reviews?.length || 0
  };
};

// Resolvers
const resolvers = {
  Query: {
    notifications: () => prisma.notification.findMany({ orderBy: { createdAt: 'desc' } }),
    deviceTokens: () => prisma.deviceToken.findMany(),
    
    // Restaurants
    restaurants: () => prisma.restaurant.findMany(),
    restaurant: async (_, { id }) => {
      const restaurant = await prisma.restaurant.findUnique({ 
        where: { id },
        include: {
          categories: {
            include: {
              foods: true
            }
          },
          reviews: true,
          zone: true
        }
      });
      
      if (!restaurant) return null;
      
      return {
        ...restaurant,
        _id: restaurant.id,
        rating: restaurant.reviewAverage || 0,
        reviewCount: restaurant.reviews?.length || 0,
        reviewData: {
          reviews: restaurant.reviews,
          ratings: restaurant.reviewAverage || 0,
          total: restaurant.reviews?.length || 0
        }
      };
    },
    
    // Near by restaurants avec géolocalisation réelle
    nearByRestaurants: async (_, { latitude, longitude, shopType, ip }) => {
      console.log(`nearByRestaurants: lat=${latitude}, lng=${longitude}, shopType=${shopType}`);
      
      const whereClause = { isActive: true };
      if (shopType) whereClause.shopType = shopType;
      
      const restaurants = await prisma.restaurant.findMany({
        where: whereClause,
        include: {
          categories: {
            include: {
              foods: true
            }
          },
          reviews: true,
          zone: true
        }
      });
      
      // Enrichir avec données géographiques
      const enrichedRestaurants = restaurants.map(r => 
        enrichRestaurantWithGeoData(r, latitude, longitude)
      );
      
      // Trier par distance (les plus proches d'abord)
      enrichedRestaurants.sort((a, b) => {
        if (a.distanceInKm === null) return 1;
        if (b.distanceInKm === null) return -1;
        return a.distanceInKm - b.distanceInKm;
      });
      
      // Filtrer: garder ceux dans la zone de livraison OU à moins de 50km
      const filteredRestaurants = enrichedRestaurants.filter(r => 
        r.isWithinDeliveryZone || (r.distanceInKm !== null && r.distanceInKm <= 50)
      );
      
      return {
        offers: [],
        sections: [],
        restaurants: filteredRestaurants,
        totalCount: filteredRestaurants.length,
        page: 1,
        limit: filteredRestaurants.length,
        hasMore: false
      };
    },
    
    // Near by restaurants preview avec pagination
    nearByRestaurantsPreview: async (_, { latitude, longitude, shopType, page = 1, limit = 10 }) => {
      console.log(`nearByRestaurantsPreview: lat=${latitude}, lng=${longitude}, shopType=${shopType}, page=${page}, limit=${limit}`);
      
      const whereClause = { isActive: true };
      if (shopType) whereClause.shopType = shopType;
      
      const restaurants = await prisma.restaurant.findMany({
        where: whereClause,
        include: {
          zone: true,
          reviews: true
        }
      });
      
      // Enrichir avec données géographiques
      const enrichedRestaurants = restaurants.map(r => 
        enrichRestaurantWithGeoData(r, latitude, longitude)
      );
      
      // Trier par distance
      enrichedRestaurants.sort((a, b) => {
        if (a.distanceInKm === null) return 1;
        if (b.distanceInKm === null) return -1;
        return a.distanceInKm - b.distanceInKm;
      });
      
      // Filtrer: garder ceux dans la zone de livraison OU à moins de 50km
      const filteredRestaurants = enrichedRestaurants.filter(r => 
        r.isWithinDeliveryZone || (r.distanceInKm !== null && r.distanceInKm <= 50)
      );
      
      // Pagination
      const totalCount = filteredRestaurants.length;
      const startIndex = (page - 1) * limit;
      const paginatedRestaurants = filteredRestaurants.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < totalCount;
      
      return {
        offers: [],
        sections: [],
        restaurants: paginatedRestaurants,
        totalCount,
        page,
        limit,
        hasMore
      };
    },
    
    topRatedVendors: async (_, { latitude, longitude }) => {
      const restaurants = await prisma.restaurant.findMany({
        where: { isActive: true },
        include: { zone: true, reviews: true }
      });
      
      const enriched = restaurants
        .map(r => enrichRestaurantWithGeoData(r, latitude, longitude))
        .filter(r => r.isWithinDeliveryZone || (r.distanceInKm !== null && r.distanceInKm <= 50))
        .sort((a, b) => (b.reviewAverage || 0) - (a.reviewAverage || 0))
        .slice(0, 10);
      
      return enriched;
    },
    
    topRatedVendorsPreview: async (_, { latitude, longitude }) => {
      const restaurants = await prisma.restaurant.findMany({
        where: { isActive: true },
        include: { zone: true, reviews: true }
      });
      
      const enriched = restaurants
        .map(r => enrichRestaurantWithGeoData(r, latitude, longitude))
        .filter(r => r.isWithinDeliveryZone || (r.distanceInKm !== null && r.distanceInKm <= 50))
        .sort((a, b) => (b.reviewAverage || 0) - (a.reviewAverage || 0))
        .slice(0, 10);
      
      return enriched;
    },
    
    mostOrderedRestaurants: async (_, { latitude, longitude, shopType }) => {
      const whereClause = { isActive: true };
      if (shopType) whereClause.shopType = shopType;
      
      const restaurants = await prisma.restaurant.findMany({
        where: whereClause,
        include: { 
          zone: true, 
          reviews: true,
          _count: { select: { orders: true } }
        }
      });
      
      const enriched = restaurants
        .map(r => ({ 
          ...enrichRestaurantWithGeoData(r, latitude, longitude),
          orderCount: r._count?.orders || 0
        }))
        .filter(r => r.isWithinDeliveryZone || (r.distanceInKm !== null && r.distanceInKm <= 50))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10);
      
      return enriched;
    },
    
    mostOrderedRestaurantsPreview: async (_, { latitude, longitude, shopType }) => {
      const whereClause = { isActive: true };
      if (shopType) whereClause.shopType = shopType;
      
      const restaurants = await prisma.restaurant.findMany({
        where: whereClause,
        include: { 
          zone: true, 
          reviews: true,
          _count: { select: { orders: true } }
        }
      });
      
      const enriched = restaurants
        .map(r => ({ 
          ...enrichRestaurantWithGeoData(r, latitude, longitude),
          orderCount: r._count?.orders || 0
        }))
        .filter(r => r.isWithinDeliveryZone || (r.distanceInKm !== null && r.distanceInKm <= 50))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10);
      
      return enriched;
    },
    
    recentOrderRestaurants: async (_, { latitude, longitude }, context) => {
      if (!context.userId) return [];
      
      const recentOrders = await prisma.order.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { restaurantId: true }
      });
      
      const restaurantIds = [...new Set(recentOrders.map(o => o.restaurantId))];
      
      const restaurants = await prisma.restaurant.findMany({
        where: { id: { in: restaurantIds }, isActive: true },
        include: { zone: true, reviews: true }
      });
      
      return restaurants.map(r => enrichRestaurantWithGeoData(r, latitude, longitude));
    },
    
    recentOrderRestaurantsPreview: async (_, { latitude, longitude }, context) => {
      if (!context.userId) return [];
      
      const recentOrders = await prisma.order.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { restaurantId: true }
      });
      
      const restaurantIds = [...new Set(recentOrders.map(o => o.restaurantId))];
      
      const restaurants = await prisma.restaurant.findMany({
        where: { id: { in: restaurantIds }, isActive: true },
        include: { zone: true, reviews: true }
      });
      
      return restaurants.map(r => enrichRestaurantWithGeoData(r, latitude, longitude));
    },
    userFavourite: async () => [],
    
    reviewsByRestaurant: async (_, { restaurant }) => {
      const reviews = await prisma.review.findMany({
        where: { restaurantId: restaurant }
      });
      const total = reviews.length;
      const ratings = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      return { reviews, ratings, total };
    },
    
    popularFoodItems: async (_, { restaurantId }) => {
      return prisma.food.findMany({
        where: { category: { restaurantId } },
        take: 10
      });
    },
    
    relatedItems: async () => [],
    popularItems: async () => [],
    
    // Categories & Foods
    categories: () => prisma.category.findMany(),
    foods: () => prisma.food.findMany(),
    subCategories: async () => [],
    subCategoriesByParentId: async () => [],
    
    // Users
    users: () => prisma.user.findMany(),
    profile: async (_, __, context) => {
      // En production, récupérer l'utilisateur depuis le contexte JWT
      if (context.userId) {
        return prisma.user.findUnique({
          where: { id: context.userId },
          include: { addresses: true }
        });
      }
      return null;
    },
    
    // Orders avec pagination améliorée
    orders: async (_, { offset = 0, limit = 20 }, context) => {
      const whereClause = context.userId ? { userId: context.userId } : {};
      
      const [orders, totalCount] = await Promise.all([
        prisma.order.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            restaurant: true,
            rider: true,
            user: true,
            review: true,
            coupon: true
          }
        }),
        prisma.order.count({ where: whereClause })
      ]);
      
      // Enrichir les commandes avec _id
      return orders.map(order => ({
        ...order,
        _id: order.id,
        restaurant: order.restaurant ? { ...order.restaurant, _id: order.restaurant.id } : null,
        rider: order.rider ? { ...order.rider, _id: order.rider.id } : null,
        user: order.user ? { ...order.user, _id: order.user.id } : null
      }));
    },
    
    order: async (_, { id }) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          restaurant: true,
          user: true,
          rider: true,
          review: true,
          coupon: true
        }
      });
      
      if (!order) return null;
      
      return {
        ...order,
        _id: order.id,
        restaurant: order.restaurant ? { ...order.restaurant, _id: order.restaurant.id } : null,
        rider: order.rider ? { ...order.rider, _id: order.rider.id } : null,
        user: order.user ? { ...order.user, _id: order.user.id } : null
      };
    },
    
    allOrders: async (_, { page = 0, limit = 20 }) => {
      const orders = await prisma.order.findMany({
        skip: page * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: true,
          user: true,
          rider: true,
          coupon: true
        }
      });
      
      return orders.map(order => ({
        ...order,
        _id: order.id,
        restaurant: order.restaurant ? { ...order.restaurant, _id: order.restaurant.id } : null,
        rider: order.rider ? { ...order.rider, _id: order.rider.id } : null,
        user: order.user ? { ...order.user, _id: order.user.id } : null
      }));
    },
    
    // Riders
    riders: () => prisma.rider.findMany(),
    rider: async (_, { id }) => {
      if (!id) return null;
      const rider = await prisma.rider.findUnique({ where: { id } });
      return rider ? { ...rider, _id: rider.id } : null;
    },
    riderOrders: async (_, __, context) => {
      if (!context.userId) return [];
      
      const orders = await prisma.order.findMany({
        where: { riderId: context.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: true,
          user: true
        }
      });
      
      return orders.map(order => ({
        ...order,
        _id: order.id,
        restaurant: order.restaurant ? { ...order.restaurant, _id: order.restaurant.id } : null,
        user: order.user ? { ...order.user, _id: order.user.id } : null
      }));
    },
    
    // Others
    reviews: () => prisma.review.findMany(),
    zones: () => prisma.zone.findMany(),
    addresses: () => prisma.address.findMany(),
    configuration: () => prisma.configuration.findFirst(),
    cuisines: async () => [],
    banners: async () => [],
    tips: async () => ({ _id: '1', tipVariations: [5, 10, 15, 20], enabled: true }),
    taxes: async () => [],
    
    // Coupon query
    coupon: async (_, { coupon: code, restaurantId }) => {
      const couponData = await prisma.coupon.findFirst({
        where: {
          code: code.toUpperCase(),
          enabled: true,
          OR: [
            { restaurantId: null },
            { restaurantId }
          ]
        }
      });
      
      if (!couponData) {
        return { coupon: null, message: "Coupon invalide ou expiré", success: false };
      }
      
      // Vérifier validité temporelle
      const now = new Date();
      if (couponData.validFrom && now < couponData.validFrom) {
        return { coupon: null, message: "Ce coupon n'est pas encore valide", success: false };
      }
      if (couponData.validUntil && now > couponData.validUntil) {
        return { coupon: null, message: "Ce coupon a expiré", success: false };
      }
      
      // Vérifier limite d'utilisation
      if (couponData.usageLimit && couponData.usedCount >= couponData.usageLimit) {
        return { coupon: null, message: "Ce coupon a atteint sa limite d'utilisation", success: false };
      }
      
      return {
        coupon: { ...couponData, _id: couponData.id },
        message: "Coupon appliqué avec succès",
        success: true
      };
    },
    
    getVersions: async () => ({
      customerAppVersion: { android: '1.0.0', ios: '1.0.0' },
      riderAppVersion: '1.0.0',
      restaurantAppVersion: '1.0.0'
    }),
    lastOrderCreds: async () => ({
      restaurantUsername: 'restaurant',
      restaurantPassword: '123456',
      riderUsername: 'rider',
      riderPassword: '123456'
    }),
    chat: async () => []
  },

  Mutation: {
    // =========== AUTHENTIFICATION ===========
    
    // Login complet compatible avec tous les clients
    login: async (_, { type, email, password, name, notificationToken, isActive, appleId }) => {
      console.log(`Login attempt: type=${type}, email=${email}`);
      
      // Type 'default' = email/password
      if (type === 'default') {
        if (!email || !password) {
          throw new Error("Email et mot de passe requis");
        }
        
        const user = await prisma.user.findUnique({ 
          where: { email },
          include: { addresses: true }
        });
        
        if (!user) {
          throw new Error("Utilisateur non trouvé");
        }
        
        const valid = await comparePassword(password, user.password);
        if (!valid) {
          throw new Error("Mot de passe incorrect");
        }
        
        // Mettre à jour le token de notification si fourni
        if (notificationToken) {
          await prisma.user.update({
            where: { id: user.id },
            data: { notificationToken }
          });
        }
        
        return {
          userId: user.id,
          token: generateToken(user.id, "USER"),
          tokenExpiration: 7 * 24 * 60 * 60, // 7 jours en secondes
          name: user.name,
          email: user.email,
          phone: user.phone,
          phoneIsVerified: user.phoneIsVerified || false,
          emailIsVerified: user.emailIsVerified || false,
          picture: null,
          addresses: user.addresses,
          isNewUser: false,
          userTypeId: "USER",
          isActive: user.isActive !== false
        };
      }
      
      // Type 'google', 'apple', 'facebook' - Social login
      if (['google', 'apple', 'facebook'].includes(type)) {
        // Chercher ou créer l'utilisateur
        let user = await prisma.user.findUnique({
          where: { email },
          include: { addresses: true }
        });
        
        let isNewUser = false;
        
        if (!user) {
          // Créer un nouvel utilisateur
          isNewUser = true;
          user = await prisma.user.create({
            data: {
              email,
              name: name || email.split('@')[0],
              emailIsVerified: true,
              isActive: true,
              notificationToken
            },
            include: { addresses: true }
          });
        } else if (notificationToken) {
          await prisma.user.update({
            where: { id: user.id },
            data: { notificationToken }
          });
        }
        
        return {
          userId: user.id,
          token: generateToken(user.id, "USER"),
          tokenExpiration: 7 * 24 * 60 * 60,
          name: user.name,
          email: user.email,
          phone: user.phone,
          phoneIsVerified: user.phoneIsVerified || false,
          emailIsVerified: true,
          picture: null,
          addresses: user.addresses,
          isNewUser,
          userTypeId: "USER",
          isActive: user.isActive !== false
        };
      }
      
      throw new Error("Type de connexion non supporté");
    },
    
    // Création d'utilisateur
    createUser: async (_, { userInput }) => {
      const { email, password, name, phone, notificationToken, emailIsVerified } = userInput;
      
      if (!email) {
        throw new Error("Email requis");
      }
      
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("Un compte avec cet email existe déjà");
      }
      
      const hashedPassword = password ? await hashPassword(password) : null;
      
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          notificationToken,
          emailIsVerified: emailIsVerified || false,
          isActive: true
        },
        include: { addresses: true }
      });
      
      return {
        userId: user.id,
        token: generateToken(user.id, "USER"),
        tokenExpiration: 7 * 24 * 60 * 60,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneIsVerified: false,
        emailIsVerified: user.emailIsVerified || false,
        picture: null,
        addresses: user.addresses,
        isNewUser: true,
        userTypeId: "USER",
        isActive: true
      };
    },
    
    // Vérification email existe
    emailExist: async (_, { email }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        return {
          _id: user.id,
          email: user.email,
          userType: 'default'
        };
      }
      return null;
    },
    
    // Vérification téléphone existe
    phoneExist: async (_, { phone }) => {
      const user = await prisma.user.findFirst({ where: { phone } });
      if (user) {
        return {
          _id: user.id,
          phone: user.phone,
          userType: 'default'
        };
      }
      return null;
    },
    
    // Envoi OTP par email
    sendOtpToEmail: async (_, { email }) => {
      const otp = generateOtp();
      otpStore.set(`email:${email}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min
      
      console.log(`OTP pour ${email}: ${otp}`); // En dev, afficher le code
      
      // TODO: En production, envoyer l'email via un service (SendGrid, etc.)
      
      return { result: true };
    },
    
    // Envoi OTP par téléphone
    sendOtpToPhoneNumber: async (_, { phone }) => {
      const otp = generateOtp();
      otpStore.set(`phone:${phone}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
      
      console.log(`OTP pour ${phone}: ${otp}`); // En dev, afficher le code
      
      // TODO: En production, envoyer le SMS via Twilio
      
      return { result: true };
    },
    
    // Vérification OTP
    verifyOtp: async (_, { otp, email, phone }) => {
      const key = email ? `email:${email}` : `phone:${phone}`;
      const stored = otpStore.get(key);
      
      if (!stored) {
        throw new Error("Aucun OTP trouvé. Veuillez en demander un nouveau.");
      }
      
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(key);
        throw new Error("OTP expiré. Veuillez en demander un nouveau.");
      }
      
      // En dev, accepter '123456' comme OTP de test
      if (otp === stored.otp || otp === '123456') {
        otpStore.delete(key);
        
        // Marquer comme vérifié
        if (email) {
          await prisma.user.updateMany({
            where: { email },
            data: { emailIsVerified: true }
          });
        } else if (phone) {
          await prisma.user.updateMany({
            where: { phone },
            data: { phoneIsVerified: true }
          });
        }
        
        return { result: true };
      }
      
      throw new Error("OTP invalide");
    },
    
    // Mot de passe oublié
    forgotPassword: async (_, { email }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Ne pas révéler si l'email existe
        return { result: true };
      }
      
      const otp = generateOtp();
      otpStore.set(`reset:${email}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
      
      console.log(`Reset OTP pour ${email}: ${otp}`);
      
      return { result: true };
    },
    
    // Réinitialisation mot de passe
    resetPassword: async (_, { password, email }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }
      
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      return { result: true };
    },
    
    // Changement mot de passe
    changePassword: async (_, { oldPassword, newPassword }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      const user = await prisma.user.findUnique({ where: { id: context.userId } });
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }
      
      const valid = await comparePassword(oldPassword, user.password);
      if (!valid) {
        throw new Error("Ancien mot de passe incorrect");
      }
      
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: context.userId },
        data: { password: hashedPassword }
      });
      
      return true;
    },
    
    // Login Restaurant
    restaurantLogin: async (_, { username, password, notificationToken }) => {
      const restaurant = await prisma.restaurant.findFirst({
        where: { username }
      });
      
      if (!restaurant) {
        throw new Error("Restaurant non trouvé");
      }
      
      const valid = await comparePassword(password, restaurant.password);
      if (!valid) {
        throw new Error("Mot de passe incorrect");
      }
      
      if (notificationToken) {
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { notificationToken }
        });
      }
      
      return {
        token: generateToken(restaurant.id, "RESTAURANT"),
        restaurantId: restaurant.id
      };
    },
    
    // Login Rider
    riderLogin: async (_, { username, password, notificationToken, timeZone }) => {
      const rider = await prisma.rider.findFirst({ where: { username } });
      
      if (!rider) {
        throw new Error("Livreur non trouvé");
      }
      
      const valid = await comparePassword(password, rider.password);
      if (!valid) {
        throw new Error("Mot de passe incorrect");
      }
      
      // Mettre à jour timeZone et token
      await prisma.rider.update({
        where: { id: rider.id },
        data: { 
          timeZone,
          ...(notificationToken && { notificationToken })
        }
      });
      
      return {
        userId: rider.id,
        token: generateToken(rider.id, "RIDER")
      };
    },
    
    // =========== USER ===========
    
    updateUser: async (_, { updateUserInput }, context) => {
      const userId = context.userId;
      if (!userId) {
        throw new Error("Non authentifié");
      }
      
      return prisma.user.update({
        where: { id: userId },
        data: updateUserInput
      });
    },
    
    updateNotificationStatus: async (_, { offerNotification, orderNotification }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      return prisma.user.update({
        where: { id: context.userId },
        data: {
          isOfferNotification: offerNotification,
          isOrderNotification: orderNotification
        }
      });
    },
    
    Deactivate: async (_, { isActive, email }) => {
      return prisma.user.update({
        where: { email },
        data: { isActive }
      });
    },
    
    pushToken: async (_, { token }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      return prisma.user.update({
        where: { id: context.userId },
        data: { notificationToken: token }
      });
    },
    
    addFavourite: async (_, { id }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      const user = await prisma.user.findUnique({ where: { id: context.userId } });
      const favourites = user.favourite || [];
      
      if (!favourites.includes(id)) {
        favourites.push(id);
      }
      
      return prisma.user.update({
        where: { id: context.userId },
        data: { favourite: favourites },
        include: { addresses: true }
      });
    },
    
    // =========== ADDRESSES ===========
    
    createAddress: async (_, { addressInput }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      await prisma.address.create({
        data: {
          ...addressInput,
          userId: context.userId,
          location: addressInput.location
        }
      });
      
      return prisma.user.findUnique({
        where: { id: context.userId },
        include: { addresses: true }
      });
    },
    
    editAddress: async (_, { addressInput }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      const { _id, ...data } = addressInput;
      
      await prisma.address.update({
        where: { id: _id },
        data
      });
      
      return prisma.user.findUnique({
        where: { id: context.userId },
        include: { addresses: true }
      });
    },
    
    deleteAddress: async (_, { id }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      await prisma.address.delete({ where: { id } });
      
      return prisma.user.findUnique({
        where: { id: context.userId },
        include: { addresses: true }
      });
    },
    
    deleteBulkAddresses: async (_, { ids }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      await prisma.address.deleteMany({
        where: { id: { in: ids } }
      });
      
      return prisma.user.findUnique({
        where: { id: context.userId },
        include: { addresses: true }
      });
    },
    
    selectAddress: async (_, { id }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      // Désélectionner toutes les adresses
      await prisma.address.updateMany({
        where: { userId: context.userId },
        data: { selected: false }
      });
      
      // Sélectionner l'adresse spécifiée
      await prisma.address.update({
        where: { id },
        data: { selected: true }
      });
      
      return prisma.user.findUnique({
        where: { id: context.userId },
        include: { addresses: true }
      });
    },
    
    // =========== NOTIFICATIONS ===========
    
    createNotification: async (_, { userId, title, message, type, data }) => {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          data,
          read: false,
          createdAt: new Date().toISOString()
        }
      });
      
      wsManager.sendNotificationToUser(userId, {
        id: notification.id,
        title,
        message,
        type,
        data
      });
      
      return notification;
    },
    
    markNotificationAsRead: async (_, { id }) => {
      return prisma.notification.update({
        where: { id },
        data: { read: true }
      });
    },
    
    addDeviceToken: async (_, { userId, token, platform }) => {
      const deviceToken = await prisma.deviceToken.create({
        data: {
          userId,
          token,
          platform,
          createdAt: new Date().toISOString()
        }
      });
      
      wsManager.addDeviceToken(userId, token);
      return deviceToken;
    },
    
    removeDeviceToken: async (_, { id }) => {
      return prisma.deviceToken.delete({ where: { id } });
    },
    
    sendNotificationToUser: async (_, { userId, title, message, type }) => {
      return wsManager.sendNotificationToUser(userId, { title, message, type });
    },
    
    // =========== ORDERS ===========
    
    // PlaceOrder complet avec validation et calcul de montant
    placeOrder: async (_, args, context) => {
      const { 
        restaurant: restaurantId, 
        orderInput, 
        paymentMethod, 
        couponCode, 
        tipping = 0, 
        taxationAmount = 0, 
        address, 
        orderDate, 
        isPickedUp = false, 
        deliveryCharges = 0, 
        instructions 
      } = args;
      
      console.log(`placeOrder: restaurant=${restaurantId}, items=${orderInput?.length}, coupon=${couponCode}`);
      
      // Validation: vérifier que le restaurant existe
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: { categories: { include: { foods: true } } }
      });
      
      if (!restaurant) {
        throw new Error("Restaurant non trouvé");
      }
      
      if (!restaurant.isActive || !restaurant.isAvailable) {
        throw new Error("Ce restaurant n'est pas disponible actuellement");
      }
      
      // Valider et calculer le montant des items
      let orderAmount = 0;
      const processedItems = [];
      
      for (const item of orderInput) {
        // Trouver le food item
        let foodItem = null;
        for (const cat of restaurant.categories) {
          const found = cat.foods.find(f => f.id === item.food);
          if (found) {
            foodItem = found;
            break;
          }
        }
        
        if (!foodItem) {
          throw new Error(`Article non trouvé: ${item.food}`);
        }
        
        if (foodItem.isOutOfStock) {
          throw new Error(`Article en rupture de stock: ${foodItem.title}`);
        }
        
        // Trouver la variation
        const variation = foodItem.variations?.find(v => v.id === item.variation);
        const itemPrice = variation ? variation.price : 0;
        const discountedPrice = variation?.discounted || itemPrice;
        
        const itemTotal = discountedPrice * item.quantity;
        orderAmount += itemTotal;
        
        processedItems.push({
          _id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          food: item.food,
          title: foodItem.title,
          description: foodItem.description,
          image: foodItem.image,
          quantity: item.quantity,
          variation: variation || null,
          addons: item.addons || [],
          specialInstructions: item.specialInstructions,
          isActive: true
        });
      }
      
      // Vérifier le montant minimum
      if (restaurant.minimumOrder && orderAmount < restaurant.minimumOrder) {
        throw new Error(`Le montant minimum de commande est ${restaurant.minimumOrder}`);
      }
      
      // Appliquer le coupon si fourni
      let couponId = null;
      let discountAmount = 0;
      
      if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
          where: {
            code: couponCode.toUpperCase(),
            enabled: true,
            OR: [
              { restaurantId: null },
              { restaurantId }
            ]
          }
        });
        
        if (coupon) {
          const now = new Date();
          const isValid = 
            (!coupon.validFrom || now >= coupon.validFrom) &&
            (!coupon.validUntil || now <= coupon.validUntil) &&
            (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
            (!coupon.minOrderAmount || orderAmount >= coupon.minOrderAmount);
          
          if (isValid) {
            if (coupon.discountType === 'percentage') {
              discountAmount = (orderAmount * coupon.discount) / 100;
              if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount);
              }
            } else {
              discountAmount = coupon.discount;
            }
            
            couponId = coupon.id;
            
            // Incrémenter le compteur d'utilisation
            await prisma.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } }
            });
          }
        }
      }
      
      // Calculer le total final
      const finalAmount = orderAmount - discountAmount + tipping + taxationAmount + deliveryCharges;
      
      // Générer un orderId unique avec préfixe du restaurant
      const orderCount = await prisma.order.count({ where: { restaurantId } });
      const prefix = restaurant.orderPrefix || 'ORD';
      const orderId = `${prefix}-${Date.now().toString(36).toUpperCase()}-${orderCount + 1}`;
      
      // Créer la commande
      const order = await prisma.order.create({
        data: {
          orderId,
          restaurantId,
          userId: context.userId,
          items: processedItems,
          deliveryAddress: address,
          paymentMethod,
          orderAmount: finalAmount,
          paidAmount: 0,
          tipping,
          taxationAmount,
          deliveryCharges,
          discountAmount,
          couponId,
          instructions,
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedTime: new Date(Date.now() + (restaurant.deliveryTime || 30) * 60000),
          isPickedUp,
          orderStatus: 'PENDING',
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
          isRinged: false,
          isRiderRinged: false
        },
        include: {
          restaurant: true,
          user: true,
          coupon: true
        }
      });
      
      // Envoyer notification au restaurant
      wsManager.sendNewOrderNotification(order);
      
      console.log(`Order created: ${orderId}, amount: ${finalAmount}, discount: ${discountAmount}`);
      
      return {
        ...order,
        _id: order.id,
        restaurant: { ...order.restaurant, _id: order.restaurant.id },
        user: order.user ? { ...order.user, _id: order.user.id } : null
      };
    },
    
    updateOrderStatus: async (_, { orderId, status }) => {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { orderStatus: status },
        include: { restaurant: true, user: true, rider: true }
      });
      
      wsManager.sendOrderStatusNotification(order, status);
      
      return { ...order, _id: order.id };
    },
    
    abortOrder: async (_, { id }, context) => {
      const order = await prisma.order.findUnique({ where: { id } });
      
      if (!order) {
        throw new Error("Commande non trouvée");
      }
      
      // Vérifier que l'utilisateur peut annuler
      if (context.userId && order.userId !== context.userId) {
        throw new Error("Non autorisé");
      }
      
      // Ne peut annuler que si la commande est en attente
      if (order.orderStatus !== 'PENDING') {
        throw new Error("Cette commande ne peut plus être annulée");
      }
      
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { 
          orderStatus: 'CANCELLED',
          cancelledAt: new Date()
        },
        include: { restaurant: true, user: true }
      });
      
      wsManager.sendOrderStatusNotification(updatedOrder, 'CANCELLED');
      
      return { ...updatedOrder, _id: updatedOrder.id };
    },
    
    reviewOrder: async (_, { reviewInput }, context) => {
      const { order: orderId, rating, description } = reviewInput;
      
      // Validation
      if (rating < 1 || rating > 5) {
        throw new Error("La note doit être entre 1 et 5");
      }
      
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { restaurant: true, review: true }
      });
      
      if (!order) {
        throw new Error("Commande non trouvée");
      }
      
      if (order.review) {
        throw new Error("Cette commande a déjà été évaluée");
      }
      
      if (order.orderStatus !== 'DELIVERED') {
        throw new Error("Vous ne pouvez évaluer qu'une commande livrée");
      }
      
      // Créer l'avis
      await prisma.review.create({
        data: {
          rating,
          description: description?.trim() || null,
          orderId,
          restaurantId: order.restaurantId,
          userId: context.userId || order.userId
        }
      });
      
      // Recalculer la moyenne du restaurant
      const reviews = await prisma.review.findMany({
        where: { restaurantId: order.restaurantId }
      });
      
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await prisma.restaurant.update({
        where: { id: order.restaurantId },
        data: { reviewAverage: avgRating }
      });
      
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: true,
          user: true,
          rider: true,
          review: true
        }
      });
      
      return { ...updatedOrder, _id: updatedOrder.id };
    },
    
    // =========== STORE MUTATIONS ===========
    
    acceptOrder: async (_, { _id, time }, context) => {
      const order = await prisma.order.findUnique({
        where: { id: _id },
        include: { restaurant: true, user: true }
      });
      
      if (!order) {
        throw new Error("Commande non trouvée");
      }
      
      const preparationMinutes = time ? parseInt(time) : 20;
      
      const updatedOrder = await prisma.order.update({
        where: { id: _id },
        data: {
          orderStatus: 'ACCEPTED',
          preparationTime: new Date(Date.now() + preparationMinutes * 60000),
          expectedTime: new Date(Date.now() + (preparationMinutes + 15) * 60000),
          acceptedAt: new Date(),
          isRinged: true
        },
        include: { restaurant: true, user: true, rider: true }
      });
      
      // Notifier l'utilisateur
      if (order.userId) {
        wsManager.sendNotificationToUser(order.userId, {
          title: "Commande acceptée",
          message: `Votre commande #${order.orderId} a été acceptée. Temps de préparation: ${preparationMinutes} min`,
          type: "ORDER_ACCEPTED"
        });
      }
      
      wsManager.sendOrderStatusNotification(updatedOrder, 'ACCEPTED');
      
      return { ...updatedOrder, _id: updatedOrder.id };
    },
    
    cancelOrder: async (_, { _id, reason }, context) => {
      const order = await prisma.order.findUnique({
        where: { id: _id },
        include: { user: true }
      });
      
      if (!order) {
        throw new Error("Commande non trouvée");
      }
      
      // Validation de la raison
      if (!reason || reason.trim().length < 5) {
        throw new Error("Veuillez fournir une raison valide pour l'annulation");
      }
      
      const updatedOrder = await prisma.order.update({
        where: { id: _id },
        data: {
          orderStatus: 'CANCELLED',
          reason: reason.trim(),
          cancelledAt: new Date(),
          isRinged: true
        },
        include: { restaurant: true, user: true, rider: true }
      });
      
      // Notifier l'utilisateur
      if (order.userId) {
        wsManager.sendNotificationToUser(order.userId, {
          title: "Commande annulée",
          message: `Votre commande #${order.orderId} a été annulée. Raison: ${reason}`,
          type: "ORDER_CANCELLED"
        });
      }
      
      wsManager.sendOrderStatusNotification(updatedOrder, 'CANCELLED');
      
      return { ...updatedOrder, _id: updatedOrder.id };
    },
    
    orderPickedUp: async (_, { _id }) => {
      const order = await prisma.order.findUnique({
        where: { id: _id },
        include: { user: true }
      });
      
      if (!order) {
        throw new Error("Commande non trouvée");
      }
      
      const updatedOrder = await prisma.order.update({
        where: { id: _id },
        data: {
          orderStatus: 'PICKED',
          isPickedUp: true,
          pickedAt: new Date()
        },
        include: { restaurant: true, user: true, rider: true }
      });
      
      // Notifier l'utilisateur
      if (order.userId) {
        wsManager.sendNotificationToUser(order.userId, {
          title: "Commande récupérée",
          message: `Votre commande #${order.orderId} a été récupérée par le livreur`,
          type: "ORDER_PICKED"
        });
      }
      
      wsManager.sendOrderStatusNotification(updatedOrder, 'PICKED');
      
      return { ...updatedOrder, _id: updatedOrder.id };
    },
    
    // Apply coupon mutation
    applyCoupon: async (_, { coupon: code, restaurantId }) => {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: code.toUpperCase().trim(),
          enabled: true,
          OR: [
            { restaurantId: null },
            { restaurantId }
          ]
        }
      });
      
      if (!coupon) {
        return { coupon: null, message: "Code coupon invalide", success: false };
      }
      
      const now = new Date();
      
      if (coupon.validFrom && now < coupon.validFrom) {
        return { coupon: null, message: "Ce coupon n'est pas encore actif", success: false };
      }
      
      if (coupon.validUntil && now > coupon.validUntil) {
        return { coupon: null, message: "Ce coupon a expiré", success: false };
      }
      
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { coupon: null, message: "Ce coupon a atteint sa limite d'utilisation", success: false };
      }
      
      return {
        coupon: { ...coupon, _id: coupon.id },
        message: `Coupon appliqué: ${coupon.discountType === 'percentage' ? coupon.discount + '%' : coupon.discount + '€'} de réduction`,
        success: true
      };
    },
    
    muteRing: async (_, { orderId }) => {
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { isRinged: true }
        });
      }
      return true;
    },
    
    // =========== RESTAURANT ===========
    
    createRestaurant: async (_, { restaurant, owner }) => {
      const hashedPassword = restaurant.password ? await hashPassword(restaurant.password) : null;
      
      return prisma.restaurant.create({
        data: {
          ...restaurant,
          password: hashedPassword,
          ownerId: owner
        }
      });
    },
    
    updateRestaurant: (_, { id, data }) =>
      prisma.restaurant.update({ where: { id }, data }),
      
    editRestaurant: async (_, { restaurant }) => {
      const { _id, ...data } = restaurant;
      return prisma.restaurant.update({
        where: { id: _id },
        data
      });
    },
    
    deleteRestaurant: (_, { id }) =>
      prisma.restaurant.update({ where: { id }, data: { isActive: false } }),
      
    toggleAvailability: async (_, { restaurantId }) => {
      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      return prisma.restaurant.update({
        where: { id: restaurantId },
        data: { isAvailable: !restaurant.isAvailable }
      });
    },
    
    // =========== CATEGORIES & FOODS ===========
    
    createCategory: (_, { data }) => prisma.category.create({ data }),
    createFood: (_, { data }) => prisma.food.create({ data }),
    updateFoodOutOfStock: async (_, { id }) => {
      const food = await prisma.food.findUnique({ where: { id } });
      await prisma.food.update({
        where: { id },
        data: { isOutOfStock: !food.isOutOfStock }
      });
      return true;
    },
    
    // =========== RIDERS ===========
    
    createRider: async (_, { data }) => {
      const hashedPassword = data.password ? await hashPassword(data.password) : null;
      return prisma.rider.create({
        data: {
          ...data,
          password: hashedPassword
        }
      });
    },
    
    updateRiderLocation: async (_, { latitude, longitude }, context) => {
      if (!context.userId) {
        throw new Error("Non authentifié");
      }
      
      return prisma.rider.update({
        where: { id: context.userId },
        data: {
          location: { coordinates: [longitude, latitude] }
        }
      });
    },
    
    // =========== REVIEWS ===========
    
    createReview: (_, { data }) => prisma.review.create({ data }),
    
    // =========== COUPONS ===========
    
    applyCoupon: async (_, { coupon, restaurantId }) => {
      // Placeholder - implémenter la logique de coupon
      return {
        coupon: null,
        message: "Coupon non trouvé",
        success: false
      };
    },
    
    // =========== CHAT ===========
    
    sendChatMessage: async (_, { orderId, message }) => {
      // Placeholder
      return {
        success: true,
        message: "Message envoyé",
        data: {
          id: `msg-${Date.now()}`,
          message: message.message,
          user: { id: '1', name: 'User' },
          createdAt: new Date().toISOString()
        }
      };
    }
  },

  // =========== TYPE RESOLVERS ===========
  
  Restaurant: {
    _id: (parent) => parent.id,
    categories: (parent) =>
      prisma.category.findMany({ where: { restaurantId: parent.id } }),
    orders: (parent) =>
      prisma.order.findMany({ where: { restaurantId: parent.id } }),
    reviews: (parent) =>
      prisma.review.findMany({ where: { restaurantId: parent.id } }),
    reviewData: async (parent) => {
      const reviews = await prisma.review.findMany({ where: { restaurantId: parent.id } });
      const total = reviews.length;
      const ratings = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      return { reviews, ratings, total };
    },
    zone: (parent) =>
      parent.zoneId
        ? prisma.zone.findUnique({ where: { id: parent.zoneId } })
        : null,
  },

  Category: {
    _id: (parent) => parent.id,
    restaurant: (parent) =>
      prisma.restaurant.findUnique({ where: { id: parent.restaurantId } }),
    foods: (parent) =>
      prisma.food.findMany({ where: { categoryId: parent.id } }),
  },

  Food: {
    _id: (parent) => parent.id,
    category: (parent) =>
      prisma.category.findUnique({ where: { id: parent.categoryId } }),
  },

  User: {
    _id: (parent) => parent.id,
    orders: (parent) => prisma.order.findMany({ where: { userId: parent.id } }),
    reviews: (parent) =>
      prisma.review.findMany({ where: { userId: parent.id } }),
    addresses: (parent) =>
      prisma.address.findMany({ where: { userId: parent.id } }),
  },

  Rider: {
    _id: (parent) => parent.id,
    orders: (parent) =>
      prisma.order.findMany({ where: { riderId: parent.id } }),
    zone: (parent) =>
      parent.zoneId
        ? prisma.zone.findUnique({ where: { id: parent.zoneId } })
        : null,
  },

  Order: {
    _id: (parent) => parent.id,
    id: (parent) => parent.orderId || parent.id,
    restaurant: (parent) =>
      parent.restaurantId
        ? prisma.restaurant.findUnique({ where: { id: parent.restaurantId } })
        : null,
    user: (parent) => 
      parent.userId
        ? prisma.user.findUnique({ where: { id: parent.userId } })
        : null,
    rider: (parent) =>
      parent.riderId
        ? prisma.rider.findUnique({ where: { id: parent.riderId } })
        : null,
    zone: (parent) =>
      parent.zoneId
        ? prisma.zone.findUnique({ where: { id: parent.zoneId } })
        : null,
    review: (parent) =>
      prisma.review.findFirst({ where: { orderId: parent.id } }),
    items: (parent) => {
      // Parse items if stored as JSON
      if (typeof parent.items === 'string') {
        try {
          return JSON.parse(parent.items);
        } catch {
          return [];
        }
      }
      return parent.items || [];
    },
    deliveryAddress: (parent) => {
      if (typeof parent.deliveryAddress === 'string') {
        try {
          return JSON.parse(parent.deliveryAddress);
        } catch {
          return null;
        }
      }
      return parent.deliveryAddress;
    }
  },

  Review: {
    _id: (parent) => parent.id,
    order: (parent) =>
      prisma.order.findUnique({ where: { id: parent.orderId } }),
    restaurant: (parent) =>
      prisma.restaurant.findUnique({ where: { id: parent.restaurantId } }),
    user: (parent) => prisma.user.findUnique({ where: { id: parent.userId } }),
  },

  Zone: {
    _id: (parent) => parent.id,
    restaurants: (parent) =>
      prisma.restaurant.findMany({ where: { zoneId: parent.id } }),
  },

  Address: {
    _id: (parent) => parent.id,
    user: (parent) => prisma.user.findUnique({ where: { id: parent.userId } }),
  },

  Notification: {
    _id: (parent) => parent.id,
  },

  DeviceToken: {
    _id: (parent) => parent.id,
  },
};

// Création du serveur
async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Créer le serveur WebSocket
  const wss = new WebSocket.Server({ 
    server: httpServer,
    path: '/ws'
  });

  // Gérer les connexions WebSocket
  wss.on('connection', (ws, request) => {
    const token = request.url.split('token=')[1];
    if (token) {
      try {
        const decoded = verifyToken(token);
        wsManager.addClient(decoded.userId, ws, decoded.role);
        
        ws.send(JSON.stringify({
          type: 'connection',
          message: 'Connecté avec succès',
          userId: decoded.userId,
          role: decoded.role
        }));
      } catch (error) {
        ws.close(1008, 'Token invalide');
      }
    } else {
      ws.close(1008, 'Token requis');
    }
  });

  // Nettoyage périodique des clients inactifs
  setInterval(() => {
    wsManager.cleanupInactiveClients();
  }, 30000);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Middleware pour extraire l'utilisateur du token JWT
  const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = verifyToken(token);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
      } catch (error) {
        // Token invalide, continuer sans authentification
      }
    }
    next();
  };

  app.use("/graphql", cors(), express.json(), authMiddleware, expressMiddleware(server, {
    context: async ({ req }) => ({
      userId: req.userId,
      userRole: req.userRole
    })
  }));

  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

  console.log("🚀 Serveur GraphQL prêt sur http://localhost:4000/graphql");
  console.log("📡 WebSocket prêt sur ws://localhost:4000/ws");
}

startServer().catch((err) => {
  console.error("Erreur lors du démarrage du serveur:", err);
});

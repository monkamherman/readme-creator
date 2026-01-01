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

// Schéma GraphQL
const typeDefs = `
  type AuthPayload {
    token: String!
    user: User!
  }

  type Notification {
    id: ID!
    userId: String!
    title: String!
    message: String!
    type: String!
    data: String
    read: Boolean!
    createdAt: String!
  }

  type DeviceToken {
    id: ID!
    userId: String!
    token: String!
    platform: String!
    createdAt: String!
  }

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

  type Variation {
    id: ID!
    title: String
    price: Float
    discounted: Float
    addons: [String]
    isOutOfStock: Boolean
  }

  type Option {
    id: ID!
    title: String
    description: String
    price: Float
    isOutOfStock: Boolean
  }

  type Addon {
    id: ID!
    title: String
    description: String
    quantityMinimum: Int
    quantityMaximum: Int
    options: [Option]
  }

  type Restaurant {
    id: ID!
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
    reviewAverage: Float
    cuisines: [String]
    isActive: Boolean
    isAvailable: Boolean
    openingTimes: [OpeningTime]
    categories: [Category]
    orders: [Order]
    reviews: [Review]
    zone: Zone
  }

  type Category {
    id: ID!
    title: String
    restaurant: Restaurant
    foods: [Food]
  }

  type Food {
    id: ID!
    title: String
    image: String
    description: String
    subCategory: String
    isOutOfStock: Boolean
    variations: [Variation]
    category: Category
  }

  type User {
    id: ID!
    name: String
    email: String
    phone: String
    password: String
    orders: [Order]
    reviews: [Review]
    addresses: [Address]
  }

  type Rider {
    id: ID!
    name: String
    username: String
    password: String
    phone: String
    available: Boolean
    location: Location
    orders: [Order]
  }

  type Order {
    id: ID!
    orderId: String
    restaurant: Restaurant
    user: User
    rider: Rider
    items: String
    deliveryAddress: String
    paymentMethod: String
    paidAmount: Float
    orderAmount: Float
    orderStatus: String
    paymentStatus: String
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
    review: Review
  }

  type Review {
    id: ID!
    rating: Int
    description: String
    order: Order
    restaurant: Restaurant
    user: User
    createdAt: String
  }

  type Zone {
    id: ID!
    title: String
    description: String
    coordinates: String
    tax: Float
    restaurants: [Restaurant]
  }

  type Address {
    id: ID!
    location: Location
    address: String
    user: User
  }

  type Configuration {
    id: ID!
    emailUsername: String
    emailPassword: String
    currency: String
    currencySymbol: String
    deliveryRate: Float
  }

  type Query {
    notifications: [Notification]
    deviceTokens: [DeviceToken]
    restaurants: [Restaurant]
    restaurant(id: ID!): Restaurant
    categories: [Category]
    foods: [Food]
    users: [User]
    orders: [Order]
    riders: [Rider]
    reviews: [Review]
    zones: [Zone]
    addresses: [Address]
    profile: User
    configuration: Configuration
  }

  type Mutation {
    # Authentification
    phoneExist(phone: String!): Boolean
    sendOtpToEmail(email: String!): Boolean
    login(email: String!, password: String!): AuthPayload
    register(name: String!, email: String!, phone: String!, password: String!): AuthPayload
    loginRestaurant(username: String!, password: String!): AuthPayload
    loginRider(username: String!, password: String!): AuthPayload
    
    # Notifications
    createNotification(userId: String!, title: String!, message: String!, type: String!, data: String): Notification
    markNotificationAsRead(id: ID!): Notification
    addDeviceToken(userId: String!, token: String!, platform: String!): DeviceToken
    removeDeviceToken(id: ID!): DeviceToken
    sendNotificationToUser(userId: String!, title: String!, message: String!, type: String!): Boolean
    updateOrderStatus(orderId: ID!, status: String!): Order
    
    # CRUD existants
    createRestaurant(data: RestaurantInput!): Restaurant
    updateRestaurant(id: ID!, data: RestaurantInput!): Restaurant
    deleteRestaurant(id: ID!): Restaurant
    createCategory(data: CategoryInput!): Category
    createFood(data: FoodInput!): Food
    createOrder(data: OrderInput!): Order
    createUser(data: UserInput!): User
    createRider(data: RiderInput!): Rider
    createReview(data: ReviewInput!): Review
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

  input UserInput {
    name: String
    email: String
    phone: String
    password: String
  }

  input RiderInput {
    name: String
    username: String
    password: String
    phone: String
    available: Boolean
  }

  input ReviewInput {
    rating: Int
    description: String
    orderId: String
    restaurantId: String
    userId: String
  }
`;

const { hashPassword, comparePassword, generateToken, verifyToken } = require('./utils/auth');
const WebSocketManager = require('./utils/websocket');

const wsManager = new WebSocketManager();

// Resolvers
const resolvers = {
  Query: {
    notifications: () => prisma.notification.findMany({ orderBy: { createdAt: 'desc' } }),
    deviceTokens: () => prisma.deviceToken.findMany(),
    restaurants: () => prisma.restaurant.findMany(),
    restaurant: (_, { id }) => prisma.restaurant.findUnique({ where: { id } }),
    categories: () => prisma.category.findMany(),
    foods: () => prisma.food.findMany(),
    users: () => prisma.user.findMany(),
    orders: () => prisma.order.findMany(),
    riders: () => prisma.rider.findMany(),
    reviews: () => prisma.review.findMany(),
    zones: () => prisma.zone.findMany(),
    addresses: () => prisma.address.findMany(),
    profile: () => prisma.user.findFirst(), // Pour le moment, retourne le premier utilisateur
    configuration: () => prisma.configuration.findFirst(),
  },

  Mutation: {
    // Authentification
    phoneExist: async (_, { phone }) => {
      const user = await prisma.user.findFirst({ where: { phone } });
      return !!user;
    },
    sendOtpToEmail: async (_, { email }) => {
      // Simulation d'envoi d'OTP - retourner true pour le moment
      console.log("OTP envoyé à:", email);
      return true;
    },
    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Utilisateur non trouvé");

      const valid = await comparePassword(password, user.password);
      if (!valid) throw new Error("Mot de passe incorrect");

      return {
        token: generateToken(user.id, "USER"),
        user,
      };
    },

    register: async (_, { name, email, phone, password }) => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) throw new Error("Email déjà utilisé");

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: { name, email, phone, password: hashedPassword },
      });

      return {
        token: generateToken(user.id, "USER"),
        user,
      };
    },

    loginRestaurant: async (_, { username, password }) => {
      const restaurant = await prisma.restaurant.findUnique({
        where: { username },
      });
      if (!restaurant) throw new Error("Restaurant non trouvé");

      const valid = await comparePassword(password, restaurant.password);
      if (!valid) throw new Error("Mot de passe incorrect");

      return {
        token: generateToken(restaurant.id, "RESTAURANT"),
        user: restaurant,
      };
    },

    loginRider: async (_, { username, password }) => {
      const rider = await prisma.rider.findUnique({ where: { username } });
      if (!rider) throw new Error("Livreur non trouvé");

      const valid = await comparePassword(password, rider.password);
      if (!valid) throw new Error("Mot de passe incorrect");

      return {
        token: generateToken(rider.id, "RIDER"),
        user: rider,
      };
    },

    // Notifications
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
      
      // Envoyer notification WebSocket
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
      return await prisma.notification.update({
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
      return await prisma.deviceToken.delete({ where: { id } });
    },
    
    sendNotificationToUser: async (_, { userId, title, message, type }) => {
      const success = wsManager.sendNotificationToUser(userId, {
        title,
        message,
        type
      });
      
      return success;
    },

    updateOrderStatus: async (_, { orderId, status }) => {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { orderStatus: status }
      });
      
      // Envoyer notification de mise à jour de statut
      wsManager.sendOrderStatusNotification(order, status);
      
      return order;
    },

    // CRUD existants
    createRestaurant: (_, { data }) => prisma.restaurant.create({ data }),
    updateRestaurant: (_, { id, data }) =>
      prisma.restaurant.update({ where: { id }, data }),
    deleteRestaurant: (_, { id }) =>
      prisma.restaurant.delete({ where: { id } }),
    createCategory: (_, { data }) => prisma.category.create({ data }),
    createFood: (_, { data }) => prisma.food.create({ data }),
    createOrder: async (_, { data }) => {
      const order = await prisma.order.create({ 
        data: {
          ...data,
          createdAt: new Date().toISOString(),
          orderStatus: 'PENDING'
        }
      });
      
      // Envoyer notifications WebSocket automatiques
      wsManager.sendNewOrderNotification(order);
      
      return order;
    },
    createUser: (_, { data }) => prisma.user.create({ data }),
    createRider: (_, { data }) => prisma.rider.create({ data }),
    createReview: (_, { data }) => prisma.review.create({ data }),
  },

  Restaurant: {
    categories: (parent) =>
      prisma.category.findMany({ where: { restaurantId: parent.id } }),
    orders: (parent) =>
      prisma.order.findMany({ where: { restaurantId: parent.id } }),
    reviews: (parent) =>
      prisma.review.findMany({ where: { restaurantId: parent.id } }),
    zone: (parent) =>
      parent.zoneId
        ? prisma.zone.findUnique({ where: { id: parent.zoneId } })
        : null,
  },

  Category: {
    restaurant: (parent) =>
      prisma.restaurant.findUnique({ where: { id: parent.restaurantId } }),
    foods: (parent) =>
      prisma.food.findMany({ where: { categoryId: parent.id } }),
  },

  Food: {
    category: (parent) =>
      prisma.category.findUnique({ where: { id: parent.categoryId } }),
  },

  User: {
    orders: (parent) => prisma.order.findMany({ where: { userId: parent.id } }),
    reviews: (parent) =>
      prisma.review.findMany({ where: { userId: parent.id } }),
    addresses: (parent) =>
      prisma.address.findMany({ where: { userId: parent.id } }),
  },

  Rider: {
    orders: (parent) =>
      prisma.order.findMany({ where: { riderId: parent.id } }),
  },

  Order: {
    restaurant: (parent) =>
      prisma.restaurant.findUnique({ where: { id: parent.restaurantId } }),
    user: (parent) => prisma.user.findUnique({ where: { id: parent.userId } }),
    rider: (parent) =>
      parent.riderId
        ? prisma.rider.findUnique({ where: { id: parent.riderId } })
        : null,
    review: (parent) =>
      prisma.review.findUnique({ where: { orderId: parent.id } }),
  },

  Review: {
    order: (parent) =>
      prisma.order.findUnique({ where: { id: parent.orderId } }),
    restaurant: (parent) =>
      prisma.restaurant.findUnique({ where: { id: parent.restaurantId } }),
    user: (parent) => prisma.user.findUnique({ where: { id: parent.userId } }),
  },

  Zone: {
    restaurants: (parent) =>
      prisma.restaurant.findMany({ where: { zoneId: parent.id } }),
  },

  Address: {
    user: (parent) => prisma.user.findUnique({ where: { id: parent.userId } }),
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
    // Extraire le token JWT des headers
    const token = request.url.split('token=')[1];
    if (token) {
      try {
        const decoded = verifyToken(token);
        wsManager.addClient(decoded.userId, ws, decoded.role);
        
        // Envoyer message de bienvenue
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
  }, 30000); // 30 secondes

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use("/graphql", cors(), express.json(), expressMiddleware(server));

  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

  console.log("🚀 Serveur GraphQL prêt sur http://localhost:4000/graphql");
}

startServer().catch((err) => {
  console.error("Erreur lors du démarrage du serveur:", err);
});

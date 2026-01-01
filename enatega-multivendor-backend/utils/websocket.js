const WebSocket = require('ws');

class WebSocketManager {
  constructor() {
    this.clients = new Map(); // userId -> WebSocket
    this.deviceTokens = new Map(); // userId -> deviceToken[]
  }

  // Ajouter un client WebSocket
  addClient(userId, ws, role = 'USER') {
    this.clients.set(userId, { ws, role, lastPing: Date.now() });
    
    ws.on('close', () => {
      this.clients.delete(userId);
    });

    ws.on('pong', () => {
      const client = this.clients.get(userId);
      if (client) {
        client.lastPing = Date.now();
      }
    });

    console.log(`Client connecté: ${userId} (${role})`);
  }

  // Ajouter un token de device
  addDeviceToken(userId, deviceToken) {
    if (!this.deviceTokens.has(userId)) {
      this.deviceTokens.set(userId, []);
    }
    this.deviceTokens.get(userId).push(deviceToken);
  }

  // Envoyer notification à un utilisateur spécifique
  sendNotificationToUser(userId, notification) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      }));
      return true;
    }
    return false;
  }

  // Envoyer notification à un rôle spécifique
  sendNotificationToRole(role, notification) {
    let sent = 0;
    for (const [userId, client] of this.clients) {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'notification',
          data: notification,
          timestamp: new Date().toISOString()
        }));
        sent++;
      }
    }
    return sent;
  }

  // Envoyer notification à tous les restaurants
  sendNotificationToRestaurants(notification) {
    return this.sendNotificationToRole('RESTAURANT', notification);
  }

  // Envoyer notification à tous les riders
  sendNotificationToRiders(notification) {
    return this.sendNotificationToRole('RIDER', notification);
  }

  // Envoyer notification de nouvelle commande
  sendNewOrderNotification(order) {
    // Notification au restaurant
    this.sendNotificationToRestaurants({
      type: 'NEW_ORDER',
      title: 'Nouvelle commande',
      message: `Commande #${order.orderId} reçue`,
      data: order
    });

    // Notification aux riders disponibles
    this.sendNotificationToRiders({
      type: 'NEW_ORDER',
      title: 'Nouvelle commande disponible',
      message: `Commande #${order.orderId} disponible pour livraison`,
      data: order
    });
  }

  // Envoyer notification de mise à jour de statut
  sendOrderStatusNotification(order, status) {
    const statusMessages = {
      'PREPARING': 'Votre commande est en préparation',
      'READY': 'Votre commande est prête',
      'PICKED_UP': 'Votre commande a été récupérée',
      'DELIVERED': 'Votre commande a été livrée'
    };

    this.sendNotificationToUser(order.userId, {
      type: 'ORDER_STATUS',
      title: 'Mise à jour de commande',
      message: statusMessages[status] || `Statut: ${status}`,
      data: { orderId: order.orderId, status }
    });
  }

  // Nettoyer les connexions inactives
  cleanupInactiveClients() {
    const now = Date.now();
    for (const [userId, client] of this.clients) {
      if (now - client.lastPing > 30000) { // 30 secondes
        client.ws.terminate();
        this.clients.delete(userId);
      }
    }
  }

  // Obtenir les statistiques
  getStats() {
    const stats = {
      totalClients: this.clients.size,
      byRole: {}
    };

    for (const [userId, client] of this.clients) {
      stats.byRole[client.role] = (stats.byRole[client.role] || 0) + 1;
    }

    return stats;
  }
}

module.exports = WebSocketManager;
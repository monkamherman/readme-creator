# 🏗️ Architecture et Fonctionnalités - Enatega Multi-Vendor

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture du Système](#architecture-du-système)
- [Applications et Modules](#applications-et-modules)
- [Fonctionnalités Détaillées](#fonctionnalités-détaillées)
- [Stack Technique](#stack-technique)
- [Flux de Données](#flux-de-données)
- [Sécurité et Authentification](#sécurité-et-authentification)
- [Intégrations Tierces](#intégrations-tierces)

---

## 🎯 Vue d'ensemble

**Enatega Multi-Vendor** est une plateforme complète de livraison de repas multi-vendeurs, similaire à UberEats ou Foodpanda. Le système permet à plusieurs restaurants d'opérer sur une même plateforme avec gestion centralisée des commandes, des coursiers et des paiements.

### Caractéristiques Principales

- ✅ **Multi-vendeurs** : Support de plusieurs restaurants et chaînes
- ✅ **Multi-zones** : Gestion de plusieurs villes/zones géographiques
- ✅ **Multi-langues** : Support de 31 langues
- ✅ **Temps réel** : Suivi des coursiers et notifications en direct
- ✅ **Multi-plateforme** : iOS, Android et Web

---

## 🏛️ Architecture du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Open Source)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Customer   │  │    Rider     │  │  Restaurant  │          │
│  │     App      │  │     App      │  │     App      │          │
│  │ React Native │  │ React Native │  │ React Native │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────────────────────────────┐    │
│  │   Customer   │  │      Admin Dashboard                 │    │
│  │     Web      │  │         Next.js                      │    │
│  │   React.js   │  │      TypeScript                      │    │
│  └──────────────┘  └──────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ GraphQL API
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Propriétaire)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Apollo GraphQL Server                      │    │
│  │                   Node.js + Express                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MongoDB    │  │   Firebase   │  │    Redis     │          │
│  │   Database   │  │     Auth     │  │    Cache     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   SERVICES EXTERNES                              │
├─────────────────────────────────────────────────────────────────┤
│  Stripe │ PayPal │ Google Maps │ Amplitude │ Sentry │ Clarity  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Applications et Modules

### 1. 🛍️ Application Client (React Native + Expo)

**Chemin** : `enatega-multivendor-app/`

#### Fonctionnalités

- **Découverte de Restaurants**
  - Affichage des restaurants par localisation
  - Filtrage par cuisine, type de restaurant
  - Sections promotionnelles (Featured, Popular, etc.)
  - Recherche avancée

- **Gestion des Commandes**
  - Panier avec variations d'articles (tailles, options)
  - Ajout d'addons et de notes spéciales
  - Choix entre livraison et retrait
  - Planification de commandes
  - Historique complet des commandes

- **Localisation**
  - Détection automatique de la position
  - Gestion de plusieurs adresses
  - Intégration Google Maps
  - Vérification des zones de livraison

- **Paiement**
  - Stripe (cartes bancaires)
  - PayPal
  - Paiement à la livraison (COD)

- **Suivi en Temps Réel**
  - Position du coursier sur la carte
  - Chat avec le coursier
  - Notifications push pour chaque étape

- **Profil Utilisateur**
  - Gestion des informations personnelles
  - Adresses favorites
  - Restaurants favoris
  - Paramètres de langue et thème

#### Technologies Clés

```javascript
{
  "expo": "~51.x",
  "react-native": "0.74.x",
  "react-navigation": "^6.x",
  "@apollo/client": "^3.x",
  "react-native-maps": "^1.x",
  "expo-location": "~17.x",
  "i18next": "^23.x"
}
```

---

### 2. 🏍️ Application Coursier (React Native + Expo)

**Chemin** : `enatega-multivendor-rider/`

#### Fonctionnalités

- **Gestion des Livraisons**
  - Réception des demandes de livraison
  - Acceptation/refus des commandes
  - Navigation GPS vers le restaurant et le client
  - Mise à jour du statut (picked up, delivered)

- **Suivi des Gains**
  - Historique des livraisons
  - Calcul des revenus
  - Statistiques de performance

- **Disponibilité**
  - Mode en ligne/hors ligne
  - Gestion de la zone de travail

- **Communication**
  - Appel direct au client
  - Notifications pour nouvelles commandes

---

### 3. 🍽️ Application Restaurant (React Native + Expo)

**Chemin** : `enatega-multivendor-store/`

#### Fonctionnalités

- **Gestion du Menu**
  - Création/modification de catégories
  - Ajout d'articles avec variations
  - Gestion des options et addons
  - Marquage des articles en rupture de stock

- **Gestion des Commandes**
  - Réception en temps réel
  - Acceptation/refus des commandes
  - Préparation et notification au coursier
  - Historique des commandes

- **Configuration du Restaurant**
  - Horaires d'ouverture personnalisés
  - Temps de préparation estimé
  - Commande minimum
  - Zone de livraison

- **Statistiques**
  - Revenus quotidiens/mensuels
  - Commandes par période
  - Articles les plus vendus

---

### 4. 💻 Site Web Client (React.js)

**Chemin** : `enatega-multivendor-web/`

#### Fonctionnalités

Version web de l'application client avec les mêmes fonctionnalités principales :
- Navigation des restaurants
- Commande en ligne
- Gestion du profil
- Suivi des commandes

#### Technologies

```javascript
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "@apollo/client": "^3.x",
  "react-google-maps": "^2.x"
}
```

---

### 5. 🎛️ Tableau de Bord Admin (Next.js)

**Chemin** : `enatega-multivendor-admin/`

#### Fonctionnalités Principales

##### Gestion des Utilisateurs
- **Super Admin** : Accès complet à la plateforme
- **Vendor Admin** : Gestion de ses propres restaurants
- **Restaurant Admin** : Gestion d'un restaurant spécifique
- **Staff** : Permissions limitées

##### Gestion des Restaurants
- Création/modification de restaurants
- Configuration des zones de livraison (polygones)
- Gestion des horaires
- Taux de commission personnalisés
- Activation/désactivation

##### Gestion des Zones
- Création de zones géographiques (villes)
- Définition des limites via Google Maps
- Association restaurants-zones

##### Gestion des Commandes (Dispatch)
- Vue en temps réel de toutes les commandes
- Attribution manuelle/automatique des coursiers
- Suivi du statut
- Gestion des problèmes

##### Gestion Financière
- **Portefeuilles**
  - Suivi des gains par restaurant
  - Suivi des gains par coursier
  - Historique des transactions
  
- **Demandes de Retrait**
  - Approbation/rejet des retraits
  - Historique des paiements

- **Commissions**
  - Configuration des taux par restaurant
  - Rapports de commissions

##### Configuration Système
- **Coupons**
  - Création de codes promo
  - Pourcentage ou montant fixe
  - Conditions d'utilisation

- **Bannières**
  - Gestion des bannières promotionnelles
  - Ordre d'affichage

- **Cuisines**
  - Types de cuisine disponibles
  - Association aux restaurants

- **Types de Magasin**
  - Restaurant, Grocery, etc.
  - Configuration par type

- **Pourboires**
  - Configuration des montants suggérés

- **Notifications**
  - Envoi de notifications push
  - Ciblage par utilisateur/groupe

##### Analytics
- Dashboard avec métriques clés
- Graphiques de revenus
- Statistiques de commandes
- Rapports exportables

#### Technologies

```typescript
{
  "next": "^14.x",
  "react": "^18.x",
  "typescript": "^5.x",
  "@apollo/client": "^3.x",
  "primereact": "^10.x",
  "tailwindcss": "^3.x",
  "@react-google-maps/api": "^2.x"
}
```

---

## 🔧 Fonctionnalités Détaillées

### 🗺️ Système de Zones Géographiques

Le système utilise un mécanisme sophistiqué de zones :

```javascript
// Structure d'une zone
{
  id: "zone_id",
  name: "Paris Centre",
  location: {
    type: "Polygon",
    coordinates: [
      [
        [2.3522, 48.8566],  // longitude, latitude
        [2.3622, 48.8566],
        [2.3622, 48.8666],
        [2.3522, 48.8666],
        [2.3522, 48.8566]   // Fermeture du polygone
      ]
    ]
  }
}
```

**Fonctionnement** :
1. L'utilisateur active sa localisation
2. Le système vérifie si les coordonnées sont dans un polygone de zone
3. Si oui → affiche les restaurants de cette zone
4. Si non → propose de sélectionner manuellement une ville

### 💳 Système de Paiement

#### Flux de Paiement

```
1. Client ajoute articles au panier
2. Sélection du mode de paiement
   ├─ Stripe → Tokenisation de la carte
   ├─ PayPal → Redirection OAuth
   └─ COD → Validation directe
3. Création de la commande
4. Traitement du paiement
5. Confirmation et notification
```

#### Calcul des Frais

```javascript
Total = Sous-total 
      + Frais de livraison (variable selon distance)
      + Taxes (configurables par restaurant)
      - Réduction coupon
      + Pourboire (optionnel)
```

### 📍 Système de Livraison

#### Attribution des Coursiers

**Critères** :
- Disponibilité (en ligne)
- Proximité du restaurant
- Nombre de commandes en cours
- Zone de travail

#### Statuts de Commande

```
PENDING → Commande créée
  ↓
ACCEPTED → Restaurant accepte
  ↓
ASSIGNED → Coursier assigné
  ↓
PICKED → Coursier récupère
  ↓
DELIVERED → Livraison terminée
  ↓
COMPLETED → Paiement confirmé

Branches alternatives:
- CANCELLED → Annulée
- REJECTED → Refusée par restaurant
```

### 🔔 Système de Notifications

#### Types de Notifications

1. **Push Notifications** (Expo)
   - Nouvelles commandes (Restaurant, Coursier)
   - Changements de statut (Client)
   - Promotions

2. **Emails**
   - Confirmation de commande
   - Réinitialisation de mot de passe
   - Rapports hebdomadaires

3. **In-App**
   - Demandes de review
   - Mises à jour importantes

---

## 🛠️ Stack Technique

### Frontend

| Technologie | Usage | Version |
|------------|-------|---------|
| **React Native** | Apps mobiles | 0.74.x |
| **Expo** | Toolchain mobile | ~51.x |
| **Next.js** | Admin dashboard | 14.x |
| **React.js** | Web client | 18.x |
| **TypeScript** | Typage statique | 5.x |
| **Apollo Client** | GraphQL client | 3.x |
| **React Navigation** | Navigation mobile | 6.x |
| **React Router** | Routing web | 6.x |
| **i18next** | Internationalisation | 23.x |
| **PrimeReact** | UI Components (Admin) | 10.x |
| **TailwindCSS** | Styling (Admin) | 3.x |

### Backend (Propriétaire)

| Technologie | Usage |
|------------|-------|
| **Node.js** | Runtime |
| **Express.js** | Framework web |
| **Apollo Server** | GraphQL server |
| **MongoDB** | Base de données |
| **Mongoose** | ODM MongoDB |
| **Firebase** | Auth & Notifications |
| **Redis** | Cache & Sessions |

### Services Externes

| Service | Usage |
|---------|-------|
| **Google Maps API** | Cartes, géocodage, directions |
| **Stripe** | Paiements par carte |
| **PayPal** | Paiements PayPal |
| **Expo Push Notifications** | Notifications push |
| **Amplitude** | Analytics |
| **Sentry** | Error tracking |
| **Microsoft Clarity** | Session recording |
| **Nodemailer** | Envoi d'emails |

---

## 🔄 Flux de Données

### Architecture GraphQL

```graphql
# Exemple de requête
query GetRestaurants($latitude: Float!, $longitude: Float!) {
  nearByRestaurants(latitude: $latitude, longitude: $longitude) {
    _id
    name
    image
    address
    deliveryTime
    minimumOrder
    isAvailable
    rating
    reviewCount
    categories {
      _id
      title
      foods {
        _id
        title
        description
        price
        image
      }
    }
  }
}

# Exemple de mutation
mutation CreateOrder($orderInput: OrderInput!) {
  createOrder(orderInput: $orderInput) {
    _id
    orderId
    orderStatus
    paymentStatus
    deliveryCharges
    total
  }
}

# Exemple de subscription
subscription OrderStatusChanged($id: ID!) {
  subscriptionOrder(id: $id) {
    _id
    orderStatus
    rider {
      _id
      name
      location {
        latitude
        longitude
      }
    }
  }
}
```

### Gestion d'État

**Applications Mobiles** :
- Context API pour l'état global
- Apollo Cache pour les données GraphQL
- AsyncStorage pour la persistance locale

**Admin Dashboard** :
- React Context
- Apollo Cache
- Local State avec useState/useReducer

---

## 🔐 Sécurité et Authentification

### Méthodes d'Authentification

1. **Email/Password**
   - Hachage bcrypt
   - Tokens JWT

2. **OAuth Social**
   - Google Sign-In
   - Apple Sign-In
   - Facebook Login

3. **Vérification**
   - Email (code OTP)
   - Téléphone (SMS OTP)

### Sécurité des Données

- **Tokens JWT** : Expiration 7 jours
- **Refresh Tokens** : Rotation automatique
- **HTTPS** : Toutes les communications
- **Validation** : Côté client et serveur
- **Sanitization** : Protection XSS/Injection

### Permissions

```typescript
// Exemple de matrice de permissions
{
  SUPER_ADMIN: ['*'],  // Tous les droits
  VENDOR: [
    'read:own_restaurants',
    'update:own_restaurants',
    'read:own_orders',
    'manage:own_staff'
  ],
  RESTAURANT_ADMIN: [
    'read:restaurant',
    'update:menu',
    'manage:orders'
  ],
  RIDER: [
    'read:assigned_orders',
    'update:delivery_status'
  ]
}
```

---

## 🔌 Intégrations Tierces

### Google Maps

**Utilisations** :
- Affichage des restaurants sur carte
- Géocodage (adresse ↔ coordonnées)
- Calcul de distance
- Directions pour coursiers
- Autocomplete d'adresses
- Dessin de zones (polygones)

### Stripe

**Flux** :
```javascript
1. Client entre les infos de carte
2. Stripe.js crée un token
3. Token envoyé au backend
4. Backend crée un PaymentIntent
5. Confirmation du paiement
6. Webhook de confirmation
```

### Amplitude

**Événements trackés** :
- Navigation entre écrans
- Ajout au panier
- Commandes passées
- Recherches
- Erreurs

### Sentry

**Monitoring** :
- Crashes d'application
- Erreurs JavaScript
- Performance monitoring
- Release tracking

---

## 📊 Modèle de Données (Simplifié)

```typescript
// User
interface User {
  _id: string;
  email: string;
  phone: string;
  name: string;
  addresses: Address[];
  role: 'USER' | 'VENDOR' | 'ADMIN' | 'RIDER';
}

// Restaurant
interface Restaurant {
  _id: string;
  name: string;
  image: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  deliveryBounds: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  owner: User;
  categories: Category[];
  openingTimes: OpeningTime[];
  isAvailable: boolean;
  minimumOrder: number;
  deliveryTime: number;
  tax: number;
  commissionRate: number;
}

// Order
interface Order {
  _id: string;
  orderId: string;
  user: User;
  restaurant: Restaurant;
  rider?: Rider;
  items: OrderItem[];
  deliveryAddress: Address;
  orderStatus: OrderStatus;
  paymentMethod: 'STRIPE' | 'PAYPAL' | 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderAmount: number;
  deliveryCharges: number;
  tipping: number;
  taxationAmount: number;
  total: number;
  createdAt: Date;
}

// Category
interface Category {
  _id: string;
  title: string;
  foods: Food[];
}

// Food
interface Food {
  _id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  variations: Variation[];
  isActive: boolean;
  isOutOfStock: boolean;
}
```

---

## 🚀 Déploiement

### Applications Mobiles

**Expo EAS Build** :
```bash
# Configuration
eas build:configure

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production

# Submit aux stores
eas submit --platform android
eas submit --platform ios
```

### Admin Dashboard

**Vercel / Netlify** :
```bash
npm run build
# Deploy automatique via Git
```

### Backend

**Recommandations** :
- AWS EC2 / DigitalOcean
- MongoDB Atlas
- Redis Cloud
- Load balancer (Nginx)
- SSL (Let's Encrypt)

---

## 📈 Scalabilité

### Optimisations Actuelles

1. **Caching**
   - Apollo Cache côté client
   - Redis côté serveur
   - Image CDN

2. **Lazy Loading**
   - Code splitting (Next.js)
   - Images lazy load
   - Pagination des listes

3. **Performance**
   - GraphQL query batching
   - Debouncing des recherches
   - Memoization React

### Améliorations Possibles

- Microservices (séparation commandes/restaurants/users)
- Message queue (RabbitMQ/Kafka)
- Elasticsearch pour recherche avancée
- CDN global (CloudFlare)
- Database sharding

---

## 📝 Licence

- **Frontend** : MIT License (Open Source)
- **Backend** : Propriétaire (Licence payante)

---

## 🤝 Support

- Documentation : [enatega.com/multivendor-documentation](https://enatega.com/multivendor-documentation/)
- Email : sales@enatega.com
- GitHub : [Enatega Multi-Vendor](https://github.com/Ninjas-Code-official/Enatega-Multivendor-Food-Delivery-Solution)

---

**Dernière mise à jour** : Décembre 2024

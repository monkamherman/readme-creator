## 🎯 Objectif du backend “plateformes client”

Ce backend a pour but de remplacer/apporter une alternative open‑source au backend propriétaire Enatega, en exposant une **API GraphQL compatible** avec les 5 clients :

- **Client final** : `enatega-multivendor-app` (mobile) et `enatega-multivendor-web`
- **Restaurant / Store** : `enatega-multivendor-store`
- **Rider / Livreur** : `enatega-multivendor-rider`
- **Admin** : `enatega-multivendor-admin`

Stack actuelle :

- **Node.js + Express**
- **Apollo Server GraphQL**
- **Prisma** (datasource MongoDB)
- **JWT** (auth), **bcryptjs** (hash)
- **WebSocket (ws)** pour notifications temps réel

Le backend actuel contient déjà :

- Un **schéma Prisma** complet (`Restaurant`, `Category`, `Food`, `User`, `Rider`, `Order`, `Review`, `Zone`, `Address`, `Configuration`, `Notification`, `DeviceToken`…)
- Un **schéma GraphQL** couvrant les entités principales
- Des mutations d’auth de base (`login`, `register`, `loginRestaurant`, `loginRider`), de **CRUD** simples et de **notifications WebSocket**

Le but de cette roadmap est de :

1. **Aligner le contrat GraphQL** sur ce qu’attendent réellement les clients existants.
2. Structurer le backend en **domaines / services** pour rester maintenable.
3. Planifier une implémentation **par phases** et **par plateforme**.

---

## 🧱 Domaines métiers et services cibles

Nous structurons le backend par “bounded contexts” alignés avec les écrans/flows des clients.

- **Domaine Auth & Utilisateur**

  - Login / logout / refresh token
  - Social login (Google, Apple, Facebook) – optionnel / phase ultérieure
  - Gestion profil utilisateur, mot de passe, vérification email / téléphone
  - Gestion des **adresses** (multi‑adresses, géoloc)
  - Gestion des **device tokens** (notifications push par user)

- **Domaine Restaurant / Catalogue**

  - Gestion des **restaurants** (infos, localisation, horaires, zone, disponibilité)
  - Gestion des **catégories & produits (foods, variations, addons)**
  - Gestion de l’**état “ouvert/fermé”**, disponibilité produits, ruptures de stock
  - Exposition d’APIs de **listing** filtré (par zone, par type, par popularité, par recherche texte)

- **Domaine Commande & Panier**

  - Création de commande à partir du panier, calcul des montants (sous‑total, taxes, livraison, pourboire, coupons)
  - Gestion du **cycle de vie de la commande** (PENDING → ACCEPTED → ASSIGNED → PICKED → DELIVERED → COMPLETED, avec CANCELLED/REJECTED)
  - Gestion de l’**historique de commandes** par client / restaurant / rider

- **Domaine Livraison / Rider**

  - Gestion des riders (profil, dispo, zone de travail, type de véhicule)
  - Attribution automatique / manuelle d’un rider à une commande
  - Mise à jour de la localisation du rider et du statut de livraison
  - Suivi en temps réel pour le client + restaurant + admin

- **Domaine Paiement**

  - Abstraction du **mode de paiement** (Stripe, PayPal, COD)
  - Calcul des frais, taxes, pourboires
  - Gestion du statut de paiement (PENDING, PAID, FAILED, REFUNDED)
  - Hooks pour webhooks Stripe/PayPal (phase ultérieure)

- **Domaine Zones & Configuration**

  - Gestion des **zones géographiques** (polygones, taxes par zone)
  - Configuration globale : devise, symbole, taux de livraison, URLs tierces, etc.

- **Domaine Notifications & Temps Réel**

  - Notifications push / in‑app pour les changements de statut de commande
  - WebSocket pour :
    - Nouvelles commandes (restaurant, rider, admin)
    - Mise à jour de statut (client, admin)
    - Chat simple client–rider (phase ultérieure)

- **Domaine Admin / Back‑Office**
  - Gestion des utilisateurs (roles : SUPER_ADMIN, VENDOR, RESTAURANT_ADMIN, STAFF, RIDER, USER)
  - Gestion des retraits, portefeuilles, commissions (phase financière)
  - Gestion des campagnes (coupons, bannières, cuisines, types de shop, pourboires suggérés, etc.)

---

## 🔗 Alignement avec les clients existants

Les clients actuels consomment déjà un backend GraphQL propriétaire avec un contrat précis.  
Dans le code front, on observe notamment :

- **Client web / mobile**

  - `login(type, email, password, name, notificationToken, isActive) → { userId, token, tokenExpiration, ... }`
  - `emailExist`, `phoneExist`, `sendOtpToEmail`, `sendOtpToPhoneNumber`, `resetPassword`, `verifyOtp`
  - Queries pour **restaurants proches, détails restaurant, menus, commandes en cours / passées, tipping, coupons, tracking rider**.

- **Store (restaurant app)**

  - Mutations : `acceptOrder`, `cancelOrder`, `orderPickedUp`, `muteRing`
  - Query restaurant par `_id`, stats, wallet, schedule, etc.

- **Rider app**

  - Login rider, configuration, wallet, earnings, work schedule, liste de commandes “new / processing / delivered”.

- **Admin (Next.js)**
  - Tables de restaurants, riders, commandes, coupons, zones, retraits, notifications, etc.

👉 **Stratégie optimale** :

1. **Inventorier systématiquement** tous les `gql` (queries, mutations, subscriptions) utilisés par chaque client.
2. Construire une **carte de mapping** entre :
   - le contrat GraphQL “legacy” (ce que le front attend)
   - le **nouveau schéma** (Prisma + GraphQL dans `enatega-multivendor-backend`)
3. Concevoir le schéma cible en essayant de :
   - **Conserver autant que possible les noms actuels** (pour limiter les changements front),
   - tout en améliorant la cohérence interne (typage fort, relations, input types).

---

## 🏗️ Architecture interne proposée

Organisation proposée dans `enatega-multivendor-backend` :

- `schema/`
  - `auth.graphql`, `user.graphql`, `restaurant.graphql`, `order.graphql`, `rider.graphql`, `zone.graphql`, `config.graphql`, `notification.graphql`, etc.
- `resolvers/`
  - `auth.resolver.js`, `user.resolver.js`, `restaurant.resolver.js`, `order.resolver.js`, `rider.resolver.js`, `zone.resolver.js`, `config.resolver.js`, `notification.resolver.js`, etc.
- `services/`
  - `AuthService`, `UserService`, `RestaurantService`, `OrderService`, `RiderService`, `ZoneService`, `PaymentService`, `NotificationService`, `ConfigService`
- `infrastructure/`
  - `prisma/` (client déjà en place)
  - `websocket/` (gestion clients, rooms, envoi de messages)
  - `security/` (JWT, middlewares auth/roles, rate limiting)

**Principe clé** :  
Les resolvers GraphQL restent **très fins** (validation, mapping I/O) et déléguent toute la logique métier aux services.

---

## 🧬 Schéma GraphQL cible (vue d’ensemble)

Sans détailler tout le SDL, les blocs principaux à couvrir / aligner :

- **Auth**

  - `login(...) → AuthPayload`
  - `register(...) → AuthPayload`
  - `emailExist`, `phoneExist`
  - `sendOtpToEmail`, `sendOtpToPhoneNumber`, `verifyOtp`
  - `resetPassword`

- **User**

  - `me/profile`
  - `updateUser(updateUserInput)`
  - `addresses` : `createAddress`, `updateAddress`, `deleteAddress`

- **Restaurant / Catalogue**

  - Query listes : `nearByRestaurants`, `restaurant(id)`, `searchRestaurants`, `featuredRestaurants`, etc.
  - Menu : `categories(restaurantId)`, `foods(categoryId)`
  - Admin / Store : `createRestaurant`, `updateRestaurant`, `toggleAvailability`, `manageOpeningTimes`, etc.

- **Order**

  - Client : `createOrder(orderInput)`, `applyCoupon`, `getTipping`, `myOrders(status?)`, `order(id)`
  - Store : `acceptOrder(_id, time)`, `cancelOrder(_id, reason)`, `orderPickedUp(_id)`
  - Rider : `acceptDelivery(orderId)`, `updateDeliveryStatus(orderId, status)`
  - Admin : filtres par zone, restaurant, rider, date, statut.

- **Rider**

  - `loginRider`, `updateRiderLocation`, `setRiderAvailability`
  - `riderOrders(status?)`, `riderEarnings`, `wallet`, `workSchedule`

- **Zones & Configuration**

  - `zones`, `zone(id)`
  - `configuration` (déjà présent, à étendre pour coller au front : `currency`, `currencySymbol`, `googleApiKey`, URLs sentry/amplitude, etc.)

- **Notifications / Temps réel**
  - Queries : `notifications`, `deviceTokens`
  - Mutations : `createNotification`, `markNotificationAsRead`, `addDeviceToken`, `removeDeviceToken`
  - WebSocket : événements “newOrder”, “orderStatusChanged”, “chatMessage”, etc.

---

## 🗺️ Feuille de route par phases

### Phase 0 – Préparation & cartographie (technique)

- [ ] **Cartographier toutes les opérations GraphQL** consommées par :
  - [ ] `enatega-multivendor-app`
  - [ ] `enatega-multivendor-web`
  - [ ] `enatega-multivendor-store`
  - [ ] `enatega-multivendor-rider`
  - [ ] `enatega-multivendor-admin`
- [ ] Pour chaque opération :
  - [ ] Noter requête/mutation/subscription
  - [ ] Variables attendues
  - [ ] Typage de la réponse
  - [ ] Écrans qui la consomment (pour prioriser)
- [ ] Construire un **document de mapping legacy → nouveau schéma**.

### Phase 1 – Socle backend & Auth de base

- [ ] Extraire le schéma GraphQL de `index.js` en fichiers modulaires (`schema/*.graphql`).
- [ ] Extraire les resolvers en modules (`resolvers/*.resolver.js`).
- [ ] Créer un `AuthService` :
  - [ ] `loginUserByEmailPassword`
  - [ ] `registerUser`
  - [ ] `loginRestaurant`, `loginRider`
  - [ ] Gestion JWT (génération, vérification, refresh – si besoin)
- [ ] Mettre en place un **middleware d’auth** (décodage JWT, injection de `context.user`).
- [ ] Mettre en place un **système de rôles** (USER, RIDER, RESTAURANT, ADMIN) et helper d’autorisation.

Livrable :

- Auth fonctionnelle pour **client**, **restaurant**, **rider** avec compatibilité maximale avec les payloads attendus par le front.

### Phase 2 – Domaine Client (customer app & web)

Focus : permettre à un client de **naviguer, commander, payer, suivre sa commande**.

- [ ] **Restaurants & menus**
  - [ ] `nearByRestaurants`, `restaurant(id)`, recherche
  - [ ] Rendu des menus (categories, foods, variations, addons)
  - [ ] Respect des ouvertures / fermetures + zones de livraison
- [ ] **Panier & commandes**
  - [ ] `createOrder(orderInput)` aligné avec `placeOrder` utilisé dans `Checkout.js`
  - [ ] Gestion des coupons (`applyCoupon`), tipping (`getTipping`)
  - [ ] Historique `myOrders`, `order(id)`
- [ ] **Suivi en temps réel**
  - [ ] Hook WebSocket / subscription `orderStatusChanged`
  - [ ] Position rider dans les commandes en cours

Stratégie :

1. D’abord implémenter toutes les opérations nécessaires au **parcours complet de commande** (happy path).
2. Ensuite couvrir les cas secondaires (annulation, re‑commande, avis, favoris, etc.).

### Phase 3 – Domaine Restaurant / Store

Objectif : permettre au restaurant de **gérer ses commandes et son menu**.

- [ ] Mutations de commande :
  - [ ] `acceptOrder(_id, time)`
  - [ ] `cancelOrder(_id, reason)`
  - [ ] `orderPickedUp(_id)`
  - [ ] `muteRing(orderId)` (gestion de notification sonore côté app)
- [ ] Gestion des horaires, zones, disponibilité restaurant.
- [ ] Consultation des **revenus, wallet, statistiques** basiques.
- [ ] Notifications temps réel nouvelles commandes + changements de statut.

### Phase 4 – Domaine Rider

Objectif : permettre au rider de **recevoir, traiter et suivre les livraisons**.

- [ ] Login rider (déjà présent, à aligner).
- [ ] Queries pour :
  - [ ] nouvelles commandes disponibles
  - [ ] commandes en cours
  - [ ] commandes livrées
- [ ] Mutations :
  - [ ] accepter une livraison
  - [ ] mettre à jour statut (`PICKED`, `DELIVERED`, etc.)
  - [ ] mise à jour localisation rider
- [ ] Wallet, earnings, work schedule, bank details.

### Phase 5 – Domaine Admin

Objectif : que `enatega-multivendor-admin` puisse **piloter la plateforme**.

- [ ] Listing et filtrage :
  - [ ] utilisateurs, restaurants, riders, commandes, zones, coupons, retraits, notifications
- [ ] Opérations clés :
  - [ ] création / édition restaurant
  - [ ] activation/désactivation
  - [ ] création de zones (avec polygones)
  - [ ] gestion des coupons, bannières, types de shop, cuisines
- [ ] Vue “dispatch” commandes + analytics de base.

### Phase 6 – Paiement & finances avancées

- [ ] Intégration Stripe/PayPal (ou mocks dans un premier temps).
- [ ] Webhooks paiement.
- [ ] Portefeuilles (restaurant, rider), retraits, commissions.

---

## ✅ Stratégies d’implémentation optimales

- **Compatibilité d’abord** : partir des requêtes/mutations déjà utilisées par les clients pour **minimiser les modifications front**.
- **Domaine avant technique** : pour chaque fonctionnalité, clarifier d’abord le **workflow métier** (qui fait quoi, dans quel ordre, quels statuts), puis le traduire en API.
- **Services métier isolés** : toute logique (calcul montants, attribution rider, gestion de zones, gestion de statuts) vit dans des **services** testables, pas dans les resolvers.
- **Sécurité dès le début** :
  - JWT obligatoire pour toutes les opérations sensibles
  - Rôles / permissions par domaine (User vs Rider vs Restaurant vs Admin)
- **Évolutivité** :
  - Prévoir dès maintenant la séparation possible en micro‑services (User/Auth, Orders, Catalog, Notification) si la charge augmente.
  - Garder le schéma GraphQL comme **façade unique** pour tous les clients.

---

## 📌 Prochaines étapes concrètes

1. **Compléter la cartographie des opérations GraphQL** côté clients et produire un document de mapping.
2. **Extraire et modulariser** le schéma et les resolvers depuis `index.js` en `schema/*` et `resolvers/*`.
3. Introduire les premiers **services métier** (`AuthService`, `RestaurantService`, `OrderService`) et faire migrer progressivement les resolvers vers ces services.
4. Implémenter le **parcours client complet** (Phase 2) jusqu’à la livraison d’une commande en mode “happy path”.
5. Ensuite, étendre aux domaines Store, Rider, puis Admin, en suivant les phases ci‑dessus.

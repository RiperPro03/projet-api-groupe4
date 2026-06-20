# Notification Service — Documentation

Microservice **Breezy** responsable des notifications utilisateur (**Fx15** : likes).

| Propriété | Valeur |
|-----------|--------|
| Port | `3008` |
| Base de données | MongoDB (`notification_db`) |
| Collection | `notifications` |
| Proxy API Gateway | `/api/notifications` → ce service |

---

## Rôle du service

Stocker et exposer les **notifications** destinées aux utilisateurs :

- recevoir les instructions de création depuis les autres microservices ;
- lister les notifications d'un utilisateur ;
- compter les notifications non lues ;
- marquer comme lues ou supprimer.

Ce service **ne gère pas** les likes, follows ou mentions eux-mêmes. Il ne rappelle jamais les services producteurs.

---

## Architecture

```txt
Requête HTTP
    ↓
routes/notification.routes.ts          → définit les endpoints
    ↓
controllers/notification.controller.ts → lit req.body / req.query, codes HTTP
    ↓
services/notification.service.ts       → règles métier + NotificationError
    ↓
models/notification.model.ts (Mongoose) → MongoDB
```

### Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `src/server.ts` | Démarre le serveur, connecte MongoDB |
| `src/app.ts` | Express + middlewares + routes |
| `src/routes/notification.routes.ts` | Déclaration des endpoints |
| `src/controllers/notification.controller.ts` | Couche HTTP |
| `src/services/notification.service.ts` | Logique métier |
| `src/config/database.ts` | Connexion Mongoose |
| `src/models/notification.model.ts` | Schéma notifications |
| `src/middlewares/error.middleware.ts` | Gestion centralisée des erreurs |

---

## Modèle de données

Collection MongoDB `notifications` :

| Champ | Type | Description |
|-------|------|-------------|
| `recipientId` | string | Utilisateur qui reçoit la notification |
| `actorId` | string | Utilisateur à l'origine de l'action |
| `type` | `"like"` | Type d'événement (Fx15) |
| `resourceType` | `"post"` \| `"comment"` | Nature de la cible likée |
| `resourceId` | string | ID du post ou du commentaire |
| `message` | string | Message affichable, généré côté service |
| `isRead` | boolean | Lu ou non |
| `readAt` | Date \| null | Date de lecture |
| `createdAt` | Date | Date de création |

Index :

```js
db.notifications.createIndex({ recipientId: 1, createdAt: -1 })
db.notifications.createIndex({ recipientId: 1, isRead: 1 })
```

---

## API

### Service direct (`http://localhost:3008`)

| Méthode | Route | Body / Query | Description |
|---------|-------|--------------|-------------|
| `GET` | `/health` | — | Santé du service |
| `POST` | `/notifications` | `{ recipientId, actorId, type, resourceType, resourceId }` | Créer une notification |
| `GET` | `/notifications` | `?recipientId=&limit=&cursor=&unreadOnly=` | Lister les notifications |
| `GET` | `/notifications/unread-count` | `?recipientId=` | Compteur non lues |
| `PATCH` | `/notifications/:id/read` | — | Marquer une notification lue |
| `PATCH` | `/notifications/read-all` | `{ recipientId }` | Tout marquer lu |
| `DELETE` | `/notifications/:id` | — | Supprimer une notification |

### Via API Gateway (`http://localhost:8080/api`)

Préfixe `/api/notifications` :

```txt
POST   /api/notifications/notifications
GET    /api/notifications/notifications?recipientId=
GET    /api/notifications/notifications/unread-count?recipientId=
PATCH  /api/notifications/notifications/:id/read
PATCH  /api/notifications/notifications/read-all
DELETE /api/notifications/notifications/:id
```

> **Auth :** les routes `GET`, `PATCH` et `DELETE` passent par `authMiddleware` dans la gateway. Le front envoie le JWT via cookies (`withCredentials: true`). En v1, `recipientId` est encore fourni en query/body par le client.

### Exemples de réponses

**POST /notifications — 201**

```json
{
  "status": "success",
  "message": "Notification created",
  "data": {
    "notification": {
      "id": "507f1f77bcf86cd799439011",
      "recipientId": "user-b",
      "actorId": "user-a",
      "type": "like",
      "resourceType": "post",
      "resourceId": "post-123",
      "message": "Un utilisateur a aimé votre post",
      "isRead": false,
      "createdAt": "2026-06-04T10:00:00.000Z",
      "readAt": null
    }
  }
}
```

**Erreur métier — 400**

```json
{
  "error": "recipientId et actorId ne peuvent pas être identiques"
}
```

---

## Fx15 — flux producteur (likes)

Le `interaction-service` appelle ce service **après un like réussi** :

```txt
POST /posts/likes ou POST /comments/likes
    ↓
like enregistré dans interaction_db
    ↓
résolution de l'auteur (post-service ou Comment local)
    ↓
si actorId != recipientId
    POST /notifications
```

Règles :

- pas de notification en **self-like** ;
- pas de notification sur **unlike** ;
- appel **fire-and-forget** : un échec ici ne fait pas échouer le like.

### Mode debug — self-like (facile à retirer)

Pour tester l'inbox seul (sans second compte), activer **sur les deux services** :

```env
DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS=true
```

Fichiers concernés : `interaction-service/.env` et `notification-service/.env` (voir `.env.example`).

Effet : liker **son propre** post ou commentaire crée quand même une notification reçue par soi-même.

Pour revenir au comportement normal : retirer la variable ou la mettre à `false`, puis redémarrer les services.

Variables côté `interaction-service` :

```env
POST_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3008
```

---

## Frontend — consommateur Fx15

Le frontend Next.js consomme ce service **via l'API Gateway** (`NEXT_PUBLIC_API_URL`, par défaut `/api`). Les routes de lecture passent par le middleware JWT de la gateway.

### Distinction importante

| Composant | Rôle |
|-----------|------|
| `NotificationProvider` + `NotificationList` | **Toasts UI** (succès / erreur après login, profil, etc.) — **sans lien** avec ce microservice |
| `NotificationInbox` + composants `Inbox*` | **Inbox utilisateur** Fx15 — consomme l'API notifications |

Ne pas confondre les deux : l'inbox est une feature distincte des toasts éphémères.

### Flux global

```txt
User B like un post/commentaire (interaction-service)
    ↓
POST /notifications (notification-service)
    ↓
User A ouvre /notif ou voit le badge cloche
    ↓
GET /api/notifications/notifications?recipientId=
    ↓
Affichage inbox + actions (lu / supprimer)
```

### Pages et routes UI

| Route front | Fichier | Description |
|-------------|---------|-------------|
| `/notif` | `apps/frontend/app/notif/page.tsx` | Page inbox (redirect login si non connecté) |
| `/posts/[id]` | `apps/frontend/app/posts/[id]/page.tsx` | Détail post — navigation depuis une notif de like post |

Le lien **Notifications** de la navbar pointe vers `/notif`. Un **badge** sur la cloche affiche le compteur non lues (`GET unread-count`).

### Fichiers frontend

| Fichier | Rôle |
|---------|------|
| `apps/frontend/types/notification.ts` | Type `UserNotification` + pagination |
| `apps/frontend/lib/api/notification.service.ts` | Client HTTP Axios vers la gateway |
| `apps/frontend/hooks/useNotificationList.ts` | État liste, pagination cursor, actions lu/supprimer |
| `apps/frontend/lib/current-user.shared.ts` | `resolveCurrentUserId()` pour `recipientId` |
| `apps/frontend/components/notifications/NotificationInbox.tsx` | Charge l'utilisateur puis la liste |
| `apps/frontend/components/notifications/InboxNotificationList.tsx` | Liste paginée + « Tout marquer comme lu » |
| `apps/frontend/components/notifications/InboxNotificationItem.tsx` | Rendu d'une notification |

### Mapping API → service front

| Action UI | Fonction front | Route gateway |
|-----------|----------------|---------------|
| Lister | `fetchUserNotifications(recipientId)` | `GET /notifications/notifications` |
| Badge cloche | `getUnreadCount(recipientId)` | `GET /notifications/notifications/unread-count` |
| Marquer lue | `markNotificationAsRead(id)` | `PATCH /notifications/notifications/:id/read` |
| Tout marquer lu | `markAllNotificationsAsRead(recipientId)` | `PATCH /notifications/notifications/read-all` |
| Supprimer | `deleteNotification(id)` | `DELETE /notifications/notifications/:id` |

Paramètres de liste utilisés par le front :

- `recipientId` — ID résolu via `profile.id_user ?? user.id_user ?? auth.id`
- `limit` — 20 par défaut
- `cursor` — pagination (ID MongoDB de la dernière notification)
- `unreadOnly` — optionnel (`true` / `1`)

### Comportement UI v1

| Cas | Comportement |
|-----|--------------|
| Like **post** | Clic → marque lu + navigation vers `/posts/{resourceId}` |
| Like **commentaire** | Clic → marque lu uniquement (pas de deep link : le backend ne fournit pas `postId`) |
| Non lue | Fond accent + point vert |
| Infinite scroll | Chargement suivant via `cursor` / `hasMore` |
| Temps réel | Non — refresh au chargement de page et au retour navbar (pas de SSE en v1) |

### Exemple — GET liste (200)
  
```json
{
  "status": "success",
  "message": "Notifications retrieved",
  "data": {
    "notifications": [
      {
        "id": "507f1f77bcf86cd799439011",
        "recipientId": "user-b",
        "actorId": "user-a",
        "type": "like",
        "resourceType": "post",
        "resourceId": "post-123",
        "message": "Un utilisateur a aimé votre post",
        "isRead": false,
        "createdAt": "2026-06-04T10:00:00.000Z",
        "readAt": null
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

### Test manuel front + back

1. Démarrer `notification-mongodb`, `notification-service`, `interaction-service`, `api-gateway`, frontend.
2. User A publie un post ; User B like le post.
3. User A ouvre `/notif` → notification visible ; badge cloche > 0.
4. Clic sur la notif post → `/posts/:id` + statut lu.
5. « Tout marquer comme lu » → badge à 0.
6. Self-like / unlike → aucune nouvelle notification.

---

## Configuration

Fichier `.env` (voir `.env.example`) :

```env
PORT=3008
SERVICE_NAME=notification-service
MONGO_URI=mongodb://localhost:27023/notification_db
```

---

## Commandes

```powershell
# Depuis services/notification-service
pnpm dev              # dev + hot reload
pnpm build            # vérifie TypeScript
pnpm test             # lance les tests Vitest
pnpm test:watch       # tests en mode watch
```

Depuis la racine du monorepo :

```powershell
pnpm dev:notification
pnpm --filter notification-service test
```

---

## Démarrage

### Local (MongoDB requis)

```powershell
docker compose up notification-mongodb
cd services/notification-service
pnpm install
pnpm dev
```

### Docker

```powershell
docker compose up --build notification-mongodb notification-service api-gateway
```

---

## Tests

Stack : **Vitest** (unitaires) + **Supertest** (HTTP).

```txt
tests/
├── notification.service.test.ts   → logique métier
├── notification.api.test.ts       → routes HTTP
└── helpers/notification.mock.ts   → données fictives
```

Les tests **mockent Mongoose** : pas besoin de MongoDB pour `pnpm test`.

Cas couverts :

- création like post / comment ;
- validation des champs et refus self-like ;
- liste, compteur non lues, marquer lu, supprimer ;
- codes HTTP et middleware d'erreurs.

---

## Évolutions prévues

| Évolution | Description |
|-----------|-------------|
| Fx14 | Notifications de mentions depuis `post-service` |
| Fx16 | Notifications de nouveaux followers depuis `follow-service` |
| Auth JWT | `recipientId` pris du token sur les routes de lecture (aujourd'hui passé en query par le front) |
| SSE | Push temps réel vers le frontend (badge + inbox sans refresh) |
| Enrichissement | Pseudo / avatar de l'acteur via `user-service` |
| Deep link commentaire | Ajouter `postId` dans la notification ou endpoint `GET /comments/:id` pour lier vers le post parent |

---

## Dépendances inter-services

| Service | Interaction |
|---------|-------------|
| **interaction-service** | Producteur Fx15 — `POST /notifications` après un like |
| **post-service** | (indirect) Fournit `authorId` à interaction-service |
| **frontend** | Consommateur Fx15 — inbox `/notif`, badge navbar, client `notification.service.ts` |
| **api-gateway** | Point d'entrée `/api/notifications` + auth JWT sur les routes de lecture |

Ce service **n'appelle aucun autre microservice** en v1.

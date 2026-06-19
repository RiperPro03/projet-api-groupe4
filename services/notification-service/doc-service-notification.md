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

Variables côté `interaction-service` :

```env
POST_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3008
```

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
| Auth JWT | `recipientId` pris du token sur les routes de lecture |
| SSE | Push temps réel vers le frontend |
| Enrichissement | Pseudo de l'acteur via `user-service` |

---

## Dépendances inter-services

| Service | Interaction |
|---------|-------------|
| **interaction-service** | Producteur Fx15 — `POST /notifications` après un like |
| **post-service** | (indirect) Fournit `authorId` à interaction-service |
| **frontend** | Consomme `GET /api/notifications/*` via gateway |
| **api-gateway** | Point d'entrée `/api/notifications` |

Ce service **n'appelle aucun autre microservice** en v1.

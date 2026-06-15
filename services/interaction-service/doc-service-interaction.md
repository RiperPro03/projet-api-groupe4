# Interaction Service — Documentation

Microservice **Breezy** responsable des likes (**Fx6**), commentaires et réponses (**Fx7**, **Fx8**).

| Propriété | Valeur |
|-----------|--------|
| Port | `3007` |
| Base de données | MongoDB (`interaction_db`) |
| Collections | `post_likes`, `comment_likes`, `comments` |
| Proxy API Gateway (futur) | `/api/interactions` → ce service |

---

## Rôle du service

### Fx6 — Likes

Gérer les **likes** sur :

- un **post** ;
- un **commentaire** (y compris une **réponse**, modélisée comme commentaire enfant).

Une réponse n'a pas de table dédiée côté likes : on la like via `/comments/likes` en passant l'ID de la réponse dans `commentId`.

### Fx7 / Fx8 — Commentaires et réponses

Gérer les **commentaires** sur un post :

- **Fx7** : commentaire racine sur un post (`parentCommentId` absent) ;
- **Fx8** : réponse à un commentaire racine (`parentCommentId` renseigné).

Une réponse est un **commentaire** dans la même collection `comments` — pas de route `/replies` dédiée.

---

## Architecture

```txt
Requête HTTP
    ↓
routes/*.routes.ts              → définit les endpoints
    ↓
controllers/*.controller.ts     → lit req.params / req.body / req.query, codes HTTP
    ↓
services/*.service.ts           → règles métier
    ↓
models/*.model.ts (Mongoose)    → MongoDB
```

### Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `src/server.ts` | Démarre le serveur, connecte MongoDB |
| `src/app.ts` | Express + middlewares + routes |
| `src/routes/like.routes.ts` | Endpoints likes (Fx6) |
| `src/routes/comment.routes.ts` | Endpoints commentaires (Fx7, Fx8) |
| `src/controllers/like.controller.ts` | Couche HTTP likes |
| `src/controllers/comment.controller.ts` | Couche HTTP commentaires |
| `src/services/like.service.ts` | Logique métier likes |
| `src/services/comment.service.ts` | Logique métier commentaires |
| `src/middlewares/error.middleware.ts` | Gestion `LikeError` et `CommentError` |
| `src/config/database.ts` | Connexion Mongoose |
| `src/models/post-like.model.ts` | Schéma likes de posts |
| `src/models/comment-like.model.ts` | Schéma likes de commentaires |
| `src/models/comment.model.ts` | Schéma commentaires et réponses |

---

## Modèle de données

### Collection `post_likes`

| Champ | Type | Description |
|-------|------|-------------|
| `userId` | string | Utilisateur qui like (FK logique → user-service) |
| `postId` | string | Post liké (FK logique → post-service) |
| `createdAt` | Date | Date de création |

**Contrainte d'unicité :** `(userId, postId)`

### Collection `comment_likes`

| Champ | Type | Description |
|-------|------|-------------|
| `userId` | string | Utilisateur qui like (FK logique → user-service) |
| `commentId` | string | Commentaire liké — racine ou réponse (FK logique → collection `comments`) |
| `postId` | string | Contexte du post parent (FK logique → post-service) |
| `createdAt` | Date | Date de création |

**Contrainte d'unicité :** `(userId, commentId)`

### Collection `comments`

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant du commentaire |
| `postId` | string | Post concerné (FK logique → post-service) |
| `userId` | string | Auteur (FK logique → user-service) |
| `parentCommentId` | string \| null | `null` = commentaire racine (Fx7) ; ID parent = réponse (Fx8) |
| `content` | string | Texte (max 500 caractères) |
| `deletedAt` | Date \| null | `null` = actif ; date = soft delete |
| `createdAt` | Date | Date de création |
| `updatedAt` | Date | Dernière modification |

**Index recommandés :**

```js
db.comments.createIndex({ postId: 1, parentCommentId: 1, createdAt: 1 })
db.comments.createIndex({ parentCommentId: 1 })
db.comments.createIndex({ userId: 1 })
```

**Règle de profondeur :** une réponse (Fx8) ne peut viser qu'un **commentaire racine**. Pas de réponse à une réponse.

---

## API

Convention alignée sur le **follow-service** : les mutations (`POST` / `PATCH` / `DELETE`) passent par le **body** ; les lectures (`GET`) acceptent **query param** ou **body** en secours pour les champs optionnels.

`postId` est **toujours dans l'URL** pour les routes commentaires.

### Service direct (`http://localhost:3007`)

#### Likes (Fx6)

| Méthode | Route | Body / Query | Description |
|---------|-------|--------------|-------------|
| `GET` | `/health` | — | Santé du service |
| `POST` | `/posts/likes` | `{ userId, postId }` | Like un post |
| `DELETE` | `/posts/likes` | `{ userId, postId }` | Unlike post |
| `GET` | `/posts/likes/count` | `?postId=` ou `{ postId }` | Compteur post |
| `POST` | `/comments/likes` | `{ userId, commentId, postId }` | Like un commentaire ou une réponse |
| `DELETE` | `/comments/likes` | `{ userId, commentId }` | Unlike commentaire ou réponse |
| `GET` | `/comments/likes/count` | `?commentId=` ou `{ commentId }` | Compteur commentaire ou réponse |

#### Commentaires (Fx7, Fx8)

| Méthode | Route | Body / Query | Description |
|---------|-------|--------------|-------------|
| `POST` | `/posts/:postId/comments` | `{ userId, content, parentCommentId? }` | **Fx7** sans `parentCommentId` ; **Fx8** avec |
| `PATCH` | `/posts/:postId/comments/:commentId` | `{ userId, content }` | Modifier (auteur uniquement) |
| `DELETE` | `/posts/:postId/comments/:commentId` | `{ userId }` | Soft delete (auteur uniquement) |
| `GET` | `/posts/:postId/comments` | `?parentCommentId=` ou `{ parentCommentId }` (optionnel) | Sans filtre → racines ; avec → réponses |

### Via API Gateway (futur)

Préfixe `/api/interactions` :

```txt
POST   /api/interactions/posts/likes       body: { userId, postId }
DELETE /api/interactions/posts/likes       body: { userId, postId }
GET    /api/interactions/posts/likes/count ?postId=

POST   /api/interactions/comments/likes       body: { userId, commentId, postId }
DELETE /api/interactions/comments/likes       body: { userId, commentId }
GET    /api/interactions/comments/likes/count ?commentId=

POST   /api/interactions/posts/:postId/comments       body: { userId, content, parentCommentId? }
PATCH  /api/interactions/posts/:postId/comments/:commentId  body: { userId, content }
DELETE /api/interactions/posts/:postId/comments/:commentId  body: { userId }
GET    /api/interactions/posts/:postId/comments       ?parentCommentId=
```

### Exemples de réponses

**POST /posts/post-123/comments — 201** (Fx7, commentaire racine)

```json
{
  "_id": "...",
  "postId": "post-123",
  "userId": "alice",
  "parentCommentId": null,
  "content": "Très intéressant !",
  "deletedAt": null,
  "createdAt": "2026-06-08T12:00:00.000Z",
  "updatedAt": "2026-06-08T12:00:00.000Z"
}
```

**POST /posts/post-123/comments — 201** (Fx8, réponse)

```json
{
  "_id": "...",
  "postId": "post-123",
  "userId": "bob",
  "parentCommentId": "comment-456",
  "content": "Je suis d'accord",
  "deletedAt": null,
  "createdAt": "2026-06-08T12:05:00.000Z",
  "updatedAt": "2026-06-08T12:05:00.000Z"
}
```

**GET /posts/post-123/comments — 200**

```json
{
  "comments": [
    {
      "_id": "comment-456",
      "postId": "post-123",
      "userId": "alice",
      "parentCommentId": null,
      "content": "Très intéressant !",
      "createdAt": "2026-06-08T12:00:00.000Z",
      "updatedAt": "2026-06-08T12:00:00.000Z"
    }
  ]
}
```

**POST /posts/likes — 201**

```json
{
  "_id": "...",
  "userId": "alice",
  "postId": "post-123",
  "createdAt": "2026-06-08T12:00:00.000Z"
}
```

### Erreurs métier

| Code | Cas |
|------|-----|
| `400` | Champs requis manquants, contenu vide, réponse à une réponse |
| `403` | Modification ou suppression par un non-auteur |
| `404` | Ressource introuvable (like, commentaire, parent) |
| `409` | Like déjà existant |
| `500` | Erreur serveur |

Messages `400` — likes :

| Route | Message |
|-------|---------|
| `POST` / `DELETE` `/posts/likes` | `userId et postId sont requis` |
| `POST` `/comments/likes` | `userId, commentId et postId sont requis` |
| `DELETE` `/comments/likes` | `userId et commentId sont requis` |
| `GET` `/posts/likes/count` | `postId est requis` |
| `GET` `/comments/likes/count` | `commentId est requis` |

Messages — commentaires :

| Route | Message |
|-------|---------|
| `POST` `/posts/:postId/comments` | `userId et content sont requis` |
| `PATCH` `/posts/:postId/comments/:commentId` | `userId et content sont requis` |
| `DELETE` `/posts/:postId/comments/:commentId` | `userId est requis` |

---

## Configuration

### Variables d'environnement

Créer un fichier `.env` (copier depuis `.env.example`) :

```env
PORT=3007
SERVICE_NAME=interaction-service
MONGO_URI=mongodb://localhost:27020/interaction_db
```

En Docker, les variables sont injectées par `docker-compose.yml`.

---

## Commandes

```powershell
# Depuis services/interaction-service
pnpm dev              # dev + hot reload
pnpm build            # compile TypeScript
pnpm test             # lance les tests Vitest
pnpm test:watch       # tests en mode watch
```

Depuis la racine du monorepo :

```powershell
pnpm dev:interaction
pnpm --filter interaction-service test
```

---

## Démarrage standalone (sans gateway ni autres services)

### Option A — MongoDB Docker + service local

```powershell
# Terminal 1 — MongoDB seul
docker compose up interaction-mongodb

# Terminal 2 — Service
cd services/interaction-service
copy .env.example .env
pnpm install
pnpm dev
```

### Option B — Tout en Docker

```powershell
docker compose up --build interaction-mongodb interaction-service
```

Vérification :

```powershell
curl http://localhost:3007/health
```

---

## Guide manuel — exemples curl (PowerShell)

### Commentaires

**Commenter un post (Fx7)**

```powershell
curl -X POST http://localhost:3007/posts/post-123/comments `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","content":"Très intéressant !"}'
```

**Répondre à un commentaire (Fx8)**

```powershell
curl -X POST http://localhost:3007/posts/post-123/comments `
  -H "Content-Type: application/json" `
  -d '{"userId":"bob","content":"Je suis d accord","parentCommentId":"comment-456"}'
```

**Lister les commentaires racine**

```powershell
curl http://localhost:3007/posts/post-123/comments
```

**Lister les réponses d'un commentaire**

```powershell
curl "http://localhost:3007/posts/post-123/comments?parentCommentId=comment-456"
```

**Modifier un commentaire**

```powershell
curl -X PATCH http://localhost:3007/posts/post-123/comments/comment-456 `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","content":"Contenu mis à jour"}'
```

**Supprimer un commentaire (soft delete)**

```powershell
curl -X DELETE http://localhost:3007/posts/post-123/comments/comment-456 `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice"}'
```

### Likes

**Like un post**

```powershell
curl -X POST http://localhost:3007/posts/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","postId":"post-123"}'
```

**Compter les likes d'un post**

```powershell
curl "http://localhost:3007/posts/likes/count?postId=post-123"
```

**Unlike un post**

```powershell
curl -X DELETE http://localhost:3007/posts/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","postId":"post-123"}'
```

**Like un commentaire ou une réponse**

```powershell
curl -X POST http://localhost:3007/comments/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","commentId":"comment-456","postId":"post-123"}'
```

---

## Tests

Stack : **Vitest** (unitaires) + **Supertest** (HTTP).

```txt
tests/
├── like.service.test.ts      → logique métier likes
├── like.api.test.ts          → routes HTTP likes
├── comment.service.test.ts   → logique métier commentaires
├── comment.api.test.ts       → routes HTTP commentaires
└── helpers/
    ├── like.mock.ts
    └── comment.mock.ts
```

Les tests **mockent Mongoose** : pas besoin de MongoDB pour `pnpm test`.

Cas couverts — likes :

- création / suppression de likes (post, commentaire, réponse) ;
- refus des doublons et body incomplet ;
- comptage via query param ou body ;
- codes HTTP de l'API.

Cas couverts — commentaires :

- création commentaire racine (Fx7) et réponse (Fx8) ;
- refus parent inexistant, réponse à une réponse, champs vides ;
- modification / suppression par auteur ; refus non-auteur (403) ;
- liste racines et réponses via query ou body ;
- codes HTTP de l'API.

---

## Dépendances inter-services

| Service | Interaction |
|---------|-------------|
| **notification-service** | (futur Fx15) Notifier lors d'un like ou commentaire |
| **post-service** | (futur) IDs post opaques ; sync `commentsCount` |
| **api-gateway** | Point d'entrée `/api/interactions` |

Le service fonctionne **de manière autonome** : aucun appel HTTP vers les autres microservices pour l'instant.

---

## Évolutions prévues

| Évolution | Description |
|-----------|-------------|
| Auth JWT | `userId` pris du token au lieu du body |
| Fx15 | Événement vers `notification-service` |
| API Gateway | Proxy `/api/interactions/*` |
| `commentsCount` | Mise à jour du compteur côté `post-service` |

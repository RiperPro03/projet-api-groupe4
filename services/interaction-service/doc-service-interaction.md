# Interaction Service — Documentation

Microservice **Breezy** responsable des likes sur les posts et commentaires (**Fx6**).

| Propriété | Valeur |
|-----------|--------|
| Port | `3007` |
| Base de données | MongoDB (`interaction_db`) |
| Collections | `post_likes`, `comment_likes` |
| Proxy API Gateway (futur) | `/api/interactions` → ce service |

---

## Rôle du service

Gérer les **likes** sur :

- un **post** ;
- un **commentaire** (y compris une **réponse**, modélisée comme commentaire enfant).

Une réponse n'a pas de table dédiée : on la like via `/comments/likes` en passant l'ID de la réponse dans `commentId`.

---

## Architecture

```txt
Requête HTTP
    ↓
routes/like.routes.ts          → définit les endpoints
    ↓
controllers/like.controller.ts → lit req.body / req.query, codes HTTP
    ↓
services/like.service.ts       → règles métier
    ↓
models/*.model.ts (Mongoose)   → MongoDB
```

### Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `src/server.ts` | Démarre le serveur, connecte MongoDB |
| `src/app.ts` | Express + middlewares + routes |
| `src/routes/like.routes.ts` | Déclaration des endpoints likes |
| `src/controllers/like.controller.ts` | Couche HTTP |
| `src/services/like.service.ts` | Logique métier |
| `src/config/database.ts` | Connexion Mongoose |
| `src/models/post-like.model.ts` | Schéma likes de posts |
| `src/models/comment-like.model.ts` | Schéma likes de commentaires (et réponses) |

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
| `commentId` | string | Commentaire liké — racine ou réponse (FK logique → post-service) |
| `postId` | string | Contexte du post parent (FK logique → post-service) |
| `createdAt` | Date | Date de création |

**Contrainte d'unicité :** `(userId, commentId)`

> Un utilisateur peut liker un post **et** plusieurs commentaires. L'unicité porte sur `(userId, commentId)` quel que soit le niveau du commentaire (racine ou réponse).

---

## API

Convention alignée sur le **follow-service** : les mutations (`POST` / `DELETE`) passent par le **body** ; les lectures (`GET`) acceptent **query param** ou **body** en secours.

### Service direct (`http://localhost:3007`)

| Méthode | Route | Body / Query | Description |
|---------|-------|--------------|-------------|
| `GET` | `/health` | — | Santé du service |
| `POST` | `/posts/likes` | `{ userId, postId }` | Like un post |
| `DELETE` | `/posts/likes` | `{ userId, postId }` | Unlike post |
| `GET` | `/posts/likes/count` | `?postId=` ou `{ postId }` | Compteur post |
| `POST` | `/comments/likes` | `{ userId, commentId, postId }` | Like un commentaire ou une réponse |
| `DELETE` | `/comments/likes` | `{ userId, commentId }` | Unlike commentaire ou réponse |
| `GET` | `/comments/likes/count` | `?commentId=` ou `{ commentId }` | Compteur commentaire ou réponse |

### Via API Gateway (futur)

Préfixe `/api/interactions` :

```txt
POST   /api/interactions/posts/likes       body: { userId, postId }
DELETE /api/interactions/posts/likes       body: { userId, postId }
GET    /api/interactions/posts/likes/count ?postId=

POST   /api/interactions/comments/likes       body: { userId, commentId, postId }
DELETE /api/interactions/comments/likes       body: { userId, commentId }
GET    /api/interactions/comments/likes/count ?commentId=
```

### Exemples de réponses

**POST /posts/likes — 201**

```json
{
  "_id": "...",
  "userId": "alice",
  "postId": "post-123",
  "createdAt": "2026-06-08T12:00:00.000Z"
}
```

**POST /comments/likes — 201** (commentaire racine)

```json
{
  "_id": "...",
  "userId": "alice",
  "commentId": "comment-456",
  "postId": "post-123",
  "createdAt": "2026-06-08T12:00:00.000Z"
}
```

**POST /comments/likes — 201** (réponse, même route avec `commentId: "reply-789"`)

**GET /posts/likes/count?postId=post-123 — 200**

```json
{
  "count": 3
}
```

### Erreurs métier

| Code | Cas |
|------|-----|
| `400` | Champs requis manquants dans le body ou la query |
| `404` | Like introuvable (unlike) |
| `409` | Like déjà existant |
| `500` | Erreur serveur |

Messages `400` :

| Route | Message |
|-------|---------|
| `POST` / `DELETE` `/posts/likes` | `userId et postId sont requis` |
| `POST` `/comments/likes` | `userId, commentId et postId sont requis` |
| `DELETE` `/comments/likes` | `userId et commentId sont requis` |
| `GET` `/posts/likes/count` | `postId est requis` |
| `GET` `/comments/likes/count` | `commentId est requis` |

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

**Like un commentaire**

```powershell
curl -X POST http://localhost:3007/comments/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","commentId":"comment-456","postId":"post-123"}'
```

**Like une réponse** (même route, ID de la réponse dans `commentId`)

```powershell
curl -X POST http://localhost:3007/comments/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","commentId":"reply-789","postId":"post-123"}'
```

**Doublon (409)** — relancer le même POST avec le même `userId` et le même identifiant cible.

---

## Tests

Stack : **Vitest** (unitaires) + **Supertest** (HTTP).

```txt
tests/
├── like.service.test.ts   → logique métier
├── like.api.test.ts       → routes HTTP
└── helpers/like.mock.ts   → données fictives
```

Les tests **mockent Mongoose** : pas besoin de MongoDB pour `pnpm test`.

Cas couverts :

- création / suppression de likes (post, commentaire, réponse via commentaires) ;
- refus des doublons et body incomplet ;
- comptage via query param ou body ;
- codes HTTP de l'API.

---

## Dépendances inter-services

| Service | Interaction |
|---------|-------------|
| **notification-service** | Fx15 — notification créée après un like réussi (fire-and-forget) |
| **post-service** | Fx15 — fournit `authorId` du post liké via `GET /posts/:id` |
| **api-gateway** | Point d'entrée `/api/interactions` |

Pour Fx6, le cœur métier des likes reste **autonome** côté persistance. Fx15 ajoute un appel HTTP optionnel vers `notification-service` qui n'impacte pas la réponse du like en cas d'échec.

### Fx15 — fichiers ajoutés

| Fichier | Rôle |
|---------|------|
| `src/clients/post.client.ts` | Récupère `authorId` via `GET /posts/:id` |
| `src/clients/notification.client.ts` | `POST /notifications` |
| `src/services/like-notification.service.ts` | Orchestration + fire-and-forget |

---

## Évolutions prévues

| Évolution | Description |
|-----------|-------------|
| Auth JWT | `userId` pris du token au lieu du body |
| Fx7 / Fx8 | CRUD commentaires et réponses |
| Fx14 / Fx16 | Autres types de notifications (hors périmètre interaction-service) |

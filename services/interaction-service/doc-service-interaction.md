# Interaction Service — Documentation

Microservice **Breezy** responsable des likes et interactions autour des posts (**Fx6**).

| Propriété | Valeur |
|-----------|--------|
| Port | `3007` |
| Base de données | MongoDB (`interaction_db`) |
| Collection | `likes` |
| Proxy API Gateway (futur) | `/api/interactions` → ce service |

---

## Rôle du service

Gérer les **likes** sur :

- un **post** ;
- un **commentaire** ;
- une **réponse** à un commentaire.

---

## Architecture

```txt
Requête HTTP
    ↓
routes/like.routes.ts         → définit les endpoints
    ↓
controllers/like.controller.ts → lit req.params / body, codes HTTP
    ↓
services/like.service.ts      → règles métier
    ↓
models/like.model.ts (Mongoose) → MongoDB
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
| `src/models/like.model.ts` | Schéma et index MongoDB |

---

## Modèle de données

Collection MongoDB `likes` :

| Champ | Type | Description |
|-------|------|-------------|
| `userId` | string | Utilisateur qui like |
| `targetType` | `"post"` \| `"comment"` \| `"reply"` | Type de cible |
| `targetId` | string | ID de la cible likée |
| `postId` | string | Contexte du post parent (auto pour `post`) |
| `createdAt` | Date | Date de création |

Contrainte : index unique `(userId, targetType, targetId)` — un utilisateur ne peut liker deux fois la même cible.

> Un utilisateur peut liker un post **et** un commentaire **et** une réponse. L'unicité porte sur le triplet `(userId, targetType, targetId)`.

---

## API

### Service direct (`http://localhost:3007`)

| Méthode | Route | Body | Description |
|---------|-------|------|-------------|
| `GET` | `/health` | — | Santé du service |
| `POST` | `/posts/:targetId/likes` | `{ userId }` | Like un post |
| `DELETE` | `/posts/:targetId/likes` | `{ userId }` | Unlike post |
| `GET` | `/posts/:targetId/likes/count` | — | Compteur post |
| `POST` | `/comments/:targetId/likes` | `{ userId, postId? }` | Like un commentaire |
| `DELETE` | `/comments/:targetId/likes` | `{ userId }` | Unlike commentaire |
| `GET` | `/comments/:targetId/likes/count` | — | Compteur commentaire |
| `POST` | `/replies/:targetId/likes` | `{ userId, postId? }` | Like une réponse |
| `DELETE` | `/replies/:targetId/likes` | `{ userId }` | Unlike réponse |
| `GET` | `/replies/:targetId/likes/count` | — | Compteur réponse |

### Exemples de réponses

**POST /posts/post-123/likes — 201**

```json
{
  "_id": "...",
  "userId": "alice",
  "targetType": "post",
  "targetId": "post-123",
  "postId": "post-123",
  "createdAt": "2026-06-08T12:00:00.000Z",
  "updatedAt": "2026-06-08T12:00:00.000Z"
}
```

**GET /posts/post-123/likes/count — 200**

```json
{
  "count": 3
}
```

**Erreurs métier**

| Code | Cas |
|------|-----|
| `400` | `userId` ou `targetId` manquant |
| `404` | Like introuvable (unlike) |
| `409` | Like déjà existant |
| `500` | Erreur serveur |

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
curl -X POST http://localhost:3007/posts/post-123/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice"}'
```

**Compter les likes d'un post**

```powershell
curl http://localhost:3007/posts/post-123/likes/count
```

**Unlike un post**

```powershell
curl -X DELETE http://localhost:3007/posts/post-123/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice"}'
```

**Like un commentaire**

```powershell
curl -X POST http://localhost:3007/comments/comment-456/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","postId":"post-123"}'
```

**Like une réponse**

```powershell
curl -X POST http://localhost:3007/replies/reply-789/likes `
  -H "Content-Type: application/json" `
  -d '{"userId":"alice","postId":"post-123"}'
```

**Doublon (409)** — relancer le même POST avec le même `userId` et la même cible.

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

- création / suppression de likes (post, commentaire, réponse) ;
- refus des doublons ;
- comptage ;
- codes HTTP de l'API.

---

## Dépendances inter-services

| Service | Interaction |
|---------|-------------|
| **notification-service** | (futur Fx15) Notifier lors d'un like — hors périmètre Fx6 |
| **post-service** | (futur) Les IDs post/comment/reply sont opaques pour Fx6 |
| **api-gateway** | (futur) Point d'entrée `/api/interactions` |

Pour Fx6, le service fonctionne **de manière autonome** : aucun appel HTTP vers les autres microservices.

---

## Évolutions prévues

| Évolution | Description |
|-----------|-------------|
| Auth JWT | `userId` pris du token au lieu du body |
| Fx7 / Fx8 | CRUD commentaires et réponses |
| Fx15 | Événement vers `notification-service` lors d'un like |
| API Gateway | Proxy `/api/interactions/*` |

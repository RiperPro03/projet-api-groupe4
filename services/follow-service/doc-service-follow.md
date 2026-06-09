# Follow Service — Documentation

Microservice **Breezy** responsable des abonnements entre utilisateurs (**Fx9**).

| Propriété | Valeur |
|-----------|--------|
| Port | `3004` |
| Base de données | PostgreSQL (Prisma 7) |
| Table | `follows` |
| Proxy API Gateway | `/api/follows` → ce service |

---

## Rôle du service

Gérer les relations **follower → following** :

- un utilisateur A suit un utilisateur B ;
- consulter qui suit qui ;
- alimenter le **feed-service** (liste des personnes suivies).

Ce service ne gère **pas** l'authentification ni les profils utilisateurs.

---

## Architecture

```txt
Requête HTTP
    ↓
routes/follow.routes.ts       → définit les endpoints
    ↓
controllers/follow.controller.ts → lit req.params, codes HTTP
    ↓
services/follow.service.ts    → règles métier
    ↓
config/database.ts (Prisma)     → PostgreSQL
```

### Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `src/server.ts` | Démarre le serveur, connecte Prisma |
| `src/app.ts` | Express + middlewares + routes |
| `src/routes/follow.routes.ts` | Déclaration des endpoints |
| `src/controllers/follow.controller.ts` | Couche HTTP |
| `src/services/follow.service.ts` | Logique métier |
| `src/config/database.ts` | Client Prisma + adapter `pg` |
| `prisma/schema.prisma` | Modèle de données |
| `prisma.config.ts` | Config CLI Prisma 7 (URL BDD) |
| `prisma/migrations/` | Migrations versionnées |

---

## Modèle de données

Table PostgreSQL `follows` :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique de la relation |
| `follower_id` | VARCHAR(255) | Utilisateur qui suit |
| `following_id` | VARCHAR(255) | Utilisateur suivi |
| `created_at` | TIMESTAMP | Date de création |

Contrainte : `UNIQUE (follower_id, following_id)` — un utilisateur ne peut suivre deux fois la même personne.

---

## API

### Service direct (`http://localhost:3004`)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Santé du service |
| `POST` | `/:followerId/:followingId` | Créer un abonnement |
| `DELETE` | `/:followerId/:followingId` | Supprimer un abonnement |
| `GET` | `/:id/following` | Utilisateurs suivis par `:id` |
| `GET` | `/:id/followers` | Abonnés de `:id` |

### Via API Gateway (`http://localhost:3000`)

Préfixe `/api/follows` :

```txt
POST   /api/follows/alice/bob
DELETE /api/follows/alice/bob
GET    /api/follows/alice/following
GET    /api/follows/bob/followers
```

### Exemples de réponses

**POST /alice/bob — 201**

```json
{
  "id": "uuid...",
  "follower_id": "alice",
  "following_id": "bob",
  "created_at": "2026-06-08T12:00:00.000Z"
}
```

**Erreurs métier**

| Code | Cas |
|------|-----|
| `400` | Auto-follow (`alice` suit `alice`) |
| `409` | Abonnement déjà existant |
| `404` | Abonnement introuvable (unfollow) |
| `500` | Erreur serveur |

---

## Configuration

### Variables d'environnement

Créer un fichier `.env` (copier depuis `.env.example`) :

```env
PORT=3004
SERVICE_NAME=follow-service
DATABASE_URL=postgres://postgres:postgres@localhost:5432/breezy
```

En Docker, les variables sont injectées par `docker-compose.yml`.

### Prisma 7

- `prisma.config.ts` : URL pour les commandes CLI (`migrate`, `generate`)
- `schema.prisma` : modèle uniquement (pas d'URL dedans)
- Client généré dans `src/generated/prisma/` (gitignored)

---

## Commandes

```powershell
# Depuis services/follow-service
pnpm dev              # dev + migrate + hot reload
pnpm build            # compile TypeScript
pnpm db:generate      # génère le client Prisma
pnpm db:deploy        # applique les migrations
pnpm test             # lance les tests Vitest
pnpm test:watch       # tests en mode watch
```

Depuis la racine du monorepo :

```powershell
pnpm dev:follow
pnpm --filter follow-service test
```

---

## Démarrage

### Local (PostgreSQL requis)

```powershell
docker compose up postgres
cd services/follow-service
pnpm db:deploy
pnpm dev
```

### Docker

```powershell
docker compose up --build postgres follow-service api-gateway
```

---

## Tests

Stack : **Vitest** (unitaires) + **Supertest** (HTTP).

```txt
tests/
├── follow.service.test.ts   → logique métier (9 tests)
├── follow.api.test.ts       → routes HTTP (9 tests)
└── helpers/prisma.mock.ts   → données fictives
```

Les tests **mockent Prisma** : pas besoin de PostgreSQL pour `pnpm test`.

Cas couverts :

- création / suppression d'un follow ;
- refus auto-follow et doublons ;
- delete ciblé sur une seule paire `(follower, following)` ;
- listes following / followers ;
- codes HTTP de l'API.

---

## Évolutions prévues

| Évolution | Description |
|-----------|-------------|
| Auth JWT | `followerId` pris du token, routes `POST /:followingId` |
| Validation utilisateur | Vérifier l'existence via `user-service` |
| Fx16 | Événement vers `notification-service` à chaque nouveau follow |
| Tests d'intégration | Base PostgreSQL de test réelle |

---

## Dépendances inter-services

| Service | Interaction |
|---------|-------------|
| **feed-service** | Consomme la liste des follows pour construire le fil |
| **user-service** | (futur) Vérifier que l'utilisateur suivi existe |
| **notification-service** | (futur) Notifier un nouveau follower |
| **api-gateway** | Point d'entrée `/api/follows` |

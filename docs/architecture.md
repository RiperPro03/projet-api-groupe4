# Architecture du projet Breezy

Mise a jour: 2026-06-25

Ce document decrit l'architecture actuelle du projet Breezy telle qu'elle est implementee dans le monorepo. Il remplace l'ancienne version previsionnelle qui mentionnait encore des services non presents ou des dossiers qui ne sont plus utilises.

## 1. Vue d'ensemble

Breezy est une application de reseau social construite en microservices. Le produit permet notamment:

- l'inscription, la connexion et la gestion de session;
- la consultation et la modification de profils;
- la creation de posts courts avec tags et medias;
- le feed chronologique;
- les follows, likes, commentaires et reponses;
- les notifications;
- le chat temps reel;
- la moderation via signalements et statuts utilisateur.

L'architecture repose sur:

- un frontend Next.js;
- une API gateway Express;
- des microservices Express separes par domaine;
- un reverse proxy Nginx public;
- un reverse proxy Nginx interne pour router entre la gateway et les services;
- des bases de donnees dediees par service;
- MinIO pour le stockage objet des medias;
- Socket.IO pour le chat.

## 2. Schema logique

```txt
Utilisateur
  |
  v
Nginx public
  |-- /                 -> frontend Next.js
  |-- /api/*            -> api-gateway
  |-- /chat/socket.io/* -> chat-service
  |-- /chat/health      -> chat-service
  |-- /minio/*          -> MinIO
  |
  v
API Gateway
  |
  v
Nginx interne
  |-- /auth/*          -> auth-service
  |-- /users/*         -> user-service
  |-- /profiles/*      -> profile-service
  |-- /posts/*         -> post-service
  |-- /media/*         -> media-service
  |-- /follows/*       -> follow-service
  |-- /interactions/*  -> interaction-service
  |-- /notifications/* -> notification-service
```

Le frontend ne contacte pas directement les microservices. Les appels HTTP applicatifs passent par `/api`, puis par l'API gateway. Le chat Socket.IO et les fichiers MinIO sont exposes par Nginx public avec des chemins dedies.

## 3. Organisation du monorepo

```txt
projet-api-groupe4/
|-- apps/
|   |-- api-gateway/
|   `-- frontend/
|-- services/
|   |-- auth-service/
|   |-- chat-service/
|   |-- follow-service/
|   |-- interaction-service/
|   |-- media-service/
|   |-- notification-service/
|   |-- post-service/
|   |-- profile-service/
|   `-- user-service/
|-- infra/
|   |-- nginx/
|   `-- nginx-internal/
|-- docs/
|   |-- api-index.md
|   |-- api-auth.md
|   |-- api-users.md
|   |-- api-profiles.md
|   |-- api-posts.md
|   |-- api-interactions.md
|   |-- api-follows.md
|   |-- api-media.md
|   |-- api-notifications.md
|   |-- api-chat.md
|   `-- architecture.md
|-- scripts/
|-- docker-compose.yml
|-- docker-compose.prod.yml
|-- package.json
|-- pnpm-lock.yaml
`-- pnpm-workspace.yaml
```

Le workspace pnpm inclut `apps/*`, `services/*` et `packages/*`. Le dossier `packages/` est prevu par la configuration, mais il n'est pas une brique centrale de l'architecture actuelle.

## 4. Entrees reseau

### Local

Le `docker-compose.yml` expose Nginx public sur:

```txt
http://localhost:8080
```

Routes principales:

| Route publique | Cible |
| --- | --- |
| `/` | Frontend Next.js |
| `/api/*` | API gateway |
| `/chat/health` | Healthcheck chat |
| `/chat/socket.io/*` | Socket.IO chat |
| `/minio/*` | API objet MinIO |

### Production

Le `docker-compose.prod.yml` expose Nginx avec:

| Port | Usage |
| --- | --- |
| `${PUBLIC_HTTP_PORT:-80}` | HTTP, redirection vers HTTPS |
| `${PUBLIC_HTTPS_PORT:-8443}` | HTTPS |

La config de production utilise `infra/nginx/nginx.prod.conf`, avec TLS via Let's Encrypt et un nom de domaine configure sur `riperpro-playhub.duckdns.org`.

## 5. API gateway

Application: `apps/api-gateway`

Port interne: `3000`

Responsabilites:

- point d'entree unique des APIs HTTP;
- verification JWT et lecture des cookies `accessToken` / `refreshToken`;
- controle RBAC sur les routes sensibles;
- forwarding vers les microservices via Nginx interne;
- agregations de donnees pour certaines routes;
- enrichissement des posts et commentaires avec profils, likes et compteurs;
- creation coordonnee a l'inscription: compte auth, profil et etat utilisateur.

Routes publiques principales:

| Prefixe gateway | Domaine |
| --- | --- |
| `/auth` | Authentification |
| `/me` | Utilisateur courant agrege |
| `/users` | Etat utilisateur et signalements |
| `/profiles` | Profils publics |
| `/posts` | Posts et feed |
| `/media` | Medias |
| `/follows` | Abonnements |
| `/comments` | Commentaires |
| `/posts/likes` | Likes de posts |
| `/comments/likes` | Likes de commentaires |
| `/notifications` | Notifications |

La documentation detaillee des routes est dans [api-index.md](api-index.md).

## 6. Reverse proxy interne

Fichier: `infra/nginx-internal/nginx.conf`

Le proxy interne evite que l'API gateway connaisse directement tous les ports des services. Elle appelle `INTERNAL_NGINX_URL`, puis Nginx interne route vers le service correct.

| Chemin interne | Service |
| --- | --- |
| `/auth/` | `auth-service:3001` |
| `/users/` | `user-service:3002`, remappe vers `/users-state/` |
| `/profiles/` | `profile-service:3006` |
| `/posts/` | `post-service:3003` |
| `/media/` | `media-service:3005` |
| `/follows/` | `follow-service:3004` |
| `/interactions/` | `interaction-service:3007` |
| `/notifications/` | `notification-service:3008` |

## 7. Services applicatifs

| Service | Port | Technologie | Stockage | Role |
| --- | --- | --- | --- | --- |
| `frontend` | `4000` | Next.js | Aucun stockage direct | Interface utilisateur |
| `api-gateway` | `3000` | Express | Aucun stockage direct | Routage, auth gateway, agregations |
| `auth-service` | `3001` | Express, Prisma | PostgreSQL | Comptes, mots de passe, JWT, refresh tokens |
| `user-service` | `3002` | Express, Prisma | PostgreSQL | Roles, statuts, signalements |
| `post-service` | `3003` | Express, Mongoose | MongoDB | Posts, tags, soft delete |
| `follow-service` | `3004` | Express, Prisma | PostgreSQL | Relations follower/following |
| `media-service` | `3005` | Express, Mongoose, MinIO SDK | MongoDB + MinIO | URL presignees et metadonnees medias |
| `profile-service` | `3006` | Express, Mongoose | MongoDB | Profils publics |
| `interaction-service` | `3007` | Express, Mongoose | MongoDB | Likes, commentaires, reponses |
| `notification-service` | `3008` | Express, Mongoose | MongoDB | Notifications |
| `chat-service` | `3009` | Express, Socket.IO | Memoire | Presence et messages prives temps reel |

### 7.1 Frontend

Dossier: `apps/frontend`

Le frontend consomme l'API via `NEXT_PUBLIC_API_URL`, avec `/api` par defaut. Il utilise des cookies HTTP-only pour la session et un proxy Next.js pour verifier ou rafraichir les tokens avant l'acces aux pages protegees.

Il consomme aussi Socket.IO pour le chat:

```txt
path: /chat/socket.io
```

### 7.2 Auth service

Dossier: `services/auth-service`

Responsabilites:

- inscription auth;
- login;
- verification de token;
- refresh token;
- logout;
- changement de mot de passe;
- stockage des refresh tokens hashes.

Base: `auth-postgres`

Tables principales:

- utilisateurs auth;
- refresh tokens.

### 7.3 User service

Dossier: `services/user-service`

Responsabilites:

- etat utilisateur: `role` et `statuts`;
- roles: `ADMIN`, `MODERATOR`, `USER`;
- statuts: `ACTIVE`, `INACTIVE`;
- signalements de contenu;
- moderation par role via la gateway.

Base: `user-postgres`

Le user-service expose ses routes internes sous `/users-state`, mais la gateway les expose publiquement sous `/users`.

### 7.4 Profile service

Dossier: `services/profile-service`

Responsabilites:

- creation de profil;
- lecture par `id_user`;
- lecture par `username`;
- recherche partielle par username;
- mise a jour et suppression.

Base: `profile-mongodb`

Collection principale: `user_info`

### 7.5 Post service

Dossier: `services/post-service`

Responsabilites:

- creation de posts courts;
- limite de 280 caracteres;
- tags explicites et hashtags extraits du contenu;
- medias attaches;
- pagination par cursor;
- feed par liste d'auteurs;
- soft delete;
- suppression des interactions d'un post supprime.

Base: `post-mongodb`

Le feed n'est plus un microservice dedie. Il est construit par la gateway avec:

```txt
follow-service -> liste des utilisateurs suivis
post-service   -> posts des utilisateurs suivis et de l'utilisateur courant
```

### 7.6 Follow service

Dossier: `services/follow-service`

Responsabilites:

- suivre un utilisateur;
- ne plus suivre un utilisateur;
- lister les abonnements;
- lister les abonnes;
- notifier un nouveau follower.

Base: `follow-postgres`

La table `follows` impose une unicite sur la paire `follower_id` / `following_id`.

### 7.7 Interaction service

Dossier: `services/interaction-service`

Responsabilites:

- likes de posts;
- likes de commentaires;
- liste des likers recents;
- statuts de likes en lot;
- commentaires de posts;
- reponses a des commentaires;
- soft delete des commentaires;
- nettoyage des interactions d'un post.

Base: `interaction-mongodb`

Collections principales:

- `post_likes`
- `comment_likes`
- `comments`

### 7.8 Media service

Dossier: `services/media-service`

Responsabilites:

- generation d'URL MinIO presignees;
- validation MIME type et taille;
- stockage des metadonnees media;
- suppression objet MinIO + metadata.

Stockage:

- metadonnees: `media-mongodb`;
- fichiers: `minio`, bucket `breezy-media`.

Le flux d'upload est:

```txt
Frontend
  -> POST /api/media/presigned-url
  <- uploadUrl, objectKey, publicUrl
Frontend
  -> PUT uploadUrl vers MinIO
Frontend
  -> reference objectKey/publicUrl dans un post ou profil
```

### 7.9 Notification service

Dossier: `services/notification-service`

Responsabilites:

- creation de notifications `like`, `mention`, `follow`;
- listing pagine par destinataire;
- compteur de non lues;
- marquage lu unitaire ou global;
- suppression.

Base: `notification-mongodb`

Les notifications sont declenchees par des appels internes depuis les services de follow, post et interaction.

### 7.10 Chat service

Dossier: `services/chat-service`

Responsabilites:

- authentification Socket.IO via auth-service;
- presence en ligne;
- messages prives temps reel;
- ack d'envoi et statut `delivered`.

Le service ne persiste pas les messages en base dans l'etat actuel. Les conversations sont donc gerees cote client/local storage, avec presence temps reel cote serveur.

## 8. Bases de donnees et volumes

| Stockage | Service consommateur | Type | Port local dev |
| --- | --- | --- | --- |
| `auth-postgres` | `auth-service` | PostgreSQL 17 | `5433` |
| `user-postgres` | `user-service` | PostgreSQL 17 | `5434` |
| `follow-postgres` | `follow-service` | PostgreSQL 17 | `5435` |
| `profile-mongodb` | `profile-service` | MongoDB 8 | `27019` |
| `interaction-mongodb` | `interaction-service` | MongoDB 8 | `27020` |
| `post-mongodb` | `post-service` | MongoDB 8 | `27021` |
| `media-mongodb` | `media-service` | MongoDB 8 | `27022` |
| `notification-mongodb` | `notification-service` | MongoDB 8 | `27023` |
| `minio` | `media-service`, frontend upload direct | Objet S3-compatible | `9000`, console `9001` |

Chaque service garde la responsabilite de ses donnees. Les autres services passent par HTTP au lieu d'acceder directement a sa base.

## 9. Authentification et autorisation

L'authentification repose sur:

- access token JWT;
- refresh token;
- cookies HTTP-only `accessToken` et `refreshToken`;
- header `Authorization: Bearer <token>` accepte par les APIs et le chat.

Flux de connexion:

```txt
Frontend -> API Gateway -> auth-service
auth-service -> verifie email/password
auth-service -> renvoie accessToken + refreshToken
frontend/gateway -> stocke les tokens en cookies HTTP-only
```

La gateway applique ensuite:

- verification du token via `auth-service`;
- recuperation du role courant via `user-service`;
- controles RBAC;
- controles owner-or-role sur les ressources sensibles.

Regles principales:

| Regle | Exemple |
| --- | --- |
| `USER`, `MODERATOR`, `ADMIN` | lecture posts, profils, commentaires |
| proprietaire de ressource | modifier son profil, liker avec son `userId`, creer un post avec son `authorId` |
| `MODERATOR`, `ADMIN` | moderation des posts/commentaires/users |
| `ADMIN` | creation/suppression d'etats utilisateur, acces global auth |

## 10. Communication inter-services

La communication est synchrone en HTTP REST.

Exemples importants:

```txt
API Gateway -> auth-service
API Gateway -> user-service
API Gateway -> profile-service
API Gateway -> post-service
API Gateway -> follow-service
API Gateway -> interaction-service
```

Agregation du feed:

```txt
GET /api/posts/feed
  -> gateway recupere l'utilisateur courant
  -> follow-service retourne les following ids
  -> post-service retourne les posts des auteurs
  -> profile-service enrichit les auteurs
  -> interaction-service ajoute likes et commentaires
```

Creation d'un compte:

```txt
POST /api/auth/register
  -> auth-service cree le compte
  -> profile-service cree le profil
  -> user-service cree role USER / statuts ACTIVE
```

Notifications:

```txt
post-service / interaction-service / follow-service
  -> notification-service
```

## 11. Documentation API

La documentation HTTP detaillee est separee par domaine:

| Fichier | Domaine |
| --- | --- |
| [api-index.md](api-index.md) | Index, bases d'appel, healthchecks |
| [api-auth.md](api-auth.md) | Authentification et session |
| [api-users.md](api-users.md) | Roles, statuts et signalements |
| [api-profiles.md](api-profiles.md) | Profils |
| [api-posts.md](api-posts.md) | Posts et feed |
| [api-interactions.md](api-interactions.md) | Likes, commentaires, reponses |
| [api-follows.md](api-follows.md) | Follows |
| [api-media.md](api-media.md) | Medias et upload MinIO |
| [api-notifications.md](api-notifications.md) | Notifications |
| [api-chat.md](api-chat.md) | Chat Socket.IO |

Une collection Postman est aussi disponible dans `docs/postman/`.

## 12. Docker local

Commande de demarrage habituelle:

```bash
docker compose up --build
```

Le compose local construit les images depuis les dossiers du repo et expose seulement les entrees utiles a l'hote:

- Nginx public sur `8080`;
- bases de donnees sur ports dev;
- MinIO sur `9000` et `9001`.

Les microservices sont sur le reseau Docker `breezy-network` et sont exposes principalement aux autres conteneurs.

## 13. Docker production

Le fichier `docker-compose.prod.yml` est prevu pour un deploiement type Docker Swarm:

- images prebuild depuis un registry;
- replicas configurables via `${APP_REPLICAS:-3}`;
- services stateful en singleton;
- Nginx public avec TLS;
- configs Docker pour les fichiers Nginx;
- volumes persistants pour Postgres, MongoDB, MinIO et Certbot.

`chat-service` est deploye en singleton car la presence est stockee en memoire. Pour le repliquer, il faudrait externaliser la presence et utiliser un adapter Socket.IO partage, par exemple Redis.

## 14. Securite

Mesures presentes:

- helmet sur les apps Express;
- CORS configure;
- cookies HTTP-only pour les tokens;
- refresh tokens stockes hashes;
- RBAC dans la gateway;
- verification owner-or-role pour posts, profils, likes, follows et commentaires;
- services non exposes directement au navigateur;
- secrets via variables d'environnement;
- healthchecks DB pour plusieurs services;
- soft delete pour posts et commentaires.

Points d'attention:

- le chat ne persiste pas les messages cote serveur;
- certaines routes internes de notification acceptent `recipientId` sans controle owner strict dans la gateway;
- la route gateway `/replies/likes` est declaree mais le service actuel ne fournit pas encore de handler specifique;
- le script racine `dev:feed` est un reste historique alors que `feed-service` n'existe plus dans l'architecture actuelle.

## 15. Conventions techniques

Services:

```txt
<domain>-service
```

Fichiers courants:

```txt
*.routes.ts
*.controller.ts
*.service.ts
*.model.ts
*.middleware.ts
```

Format API recommande:

```json
{
  "status": "success",
  "message": "Optional message",
  "data": {}
}
```

Certains services existants retournent encore des formats plus directs, par exemple `{ "count": 1 }`, `{ "userIds": [] }`, un tableau de follows ou `{ "error": "..." }`. Ces differences sont documentees dans les fichiers `api-*.md`.

## 16. Evolution possible

Ameliorations naturelles:

- persister les messages prives cote serveur;
- ajouter Redis pour presence Socket.IO et cache;
- harmoniser les formats de reponse entre services;
- supprimer les scripts historiques non alignes avec les services actuels;
- renforcer l'ownership des notifications;
- ajouter OpenAPI ou generation automatique de contrat;
- ajouter une communication asynchrone pour les notifications;
- separer eventuellement un vrai service de recherche si la recherche depasse les tags.

## 17. Conclusion

Breezy utilise aujourd'hui une architecture microservices pragmatique: la gateway centralise l'entree HTTP et la securite, les services gardent leurs donnees, et Nginx separe clairement l'exposition publique du routage interne.

La conception reste evolutive, mais certaines fonctions initialement prevues comme services autonomes sont maintenant integrees autrement:

- le feed est construit par la gateway a partir des follows, posts et interactions;
- la recherche par tag est portee par le post-service;
- la moderation est portee par les signalements du user-service et les controles RBAC;
- la messagerie privee est portee par le chat-service Socket.IO.


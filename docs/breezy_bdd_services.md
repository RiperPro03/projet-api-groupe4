# Breezy - Bases de donnees par service

Ce document decrit les bases de donnees et stockages reellement utilises par les services Breezy. Il remplace l'ancienne proposition qui mentionnait des services separes qui ne sont plus presents dans le repo.

Documents lies:

- [architecture.md](architecture.md)
- [decoupage_services_breezy.md](decoupage_services_breezy.md)
- [api-index.md](api-index.md)

## 1. Regle d'architecture

Chaque service garde la responsabilite de ses donnees. Un service ne lit pas directement la base d'un autre service.

Correct:

```txt
post-service -> appelle interaction-service via HTTP
```

Incorrect:

```txt
post-service -> lit directement interaction_mongodb
```

L'API gateway et le frontend n'ont pas de base de donnees propre. Ils orchestrent et consomment les APIs.

## 2. Vue globale

| Service | Stockage | Base / bucket | Role des donnees |
| --- | --- | --- | --- |
| `auth-service` | PostgreSQL | `auth_db` | Comptes, mots de passe hashes, refresh tokens |
| `user-service` | PostgreSQL | `user_db` | Roles, statuts, signalements |
| `follow-service` | PostgreSQL | `follow_db` | Relations follower/following |
| `profile-service` | MongoDB | `profile_db` | Profils publics |
| `post-service` | MongoDB | `post_db` | Posts, tags, medias references |
| `interaction-service` | MongoDB | `interaction_db` | Likes, commentaires, reponses |
| `notification-service` | MongoDB | `notification_db` | Notifications utilisateur |
| `media-service` | MongoDB | `media_db` | Metadonnees de fichiers |
| `media-service` | MinIO | `breezy-media` | Fichiers uploades |
| `chat-service` | Memoire | Aucun | Presence et messages temps reel non persistants |

## 3. Ports locaux et volumes Docker

| Conteneur | Type | Port local | Volume |
| --- | --- | --- | --- |
| `auth-postgres` | PostgreSQL 17 | `5433` | `auth_postgres_data` |
| `user-postgres` | PostgreSQL 17 | `5434` | `user_postgres_data` |
| `follow-postgres` | PostgreSQL 17 | `5435` | `follow_postgres_data` |
| `profile-mongodb` | MongoDB 8 | `27019` | `profile_mongodb_data` |
| `interaction-mongodb` | MongoDB 8 | `27020` | `interaction_mongodb_data` |
| `post-mongodb` | MongoDB 8 | `27021` | `post_mongodb_data` |
| `media-mongodb` | MongoDB 8 | `27022` | `media_mongodb_data` |
| `notification-mongodb` | MongoDB 8 | `27023` | `notification_mongodb_data` |
| `minio` | S3-compatible | `9000`, `9001` | `minio_data` |

## 4. PostgreSQL

### 4.1 auth-service

Schema source: `services/auth-service/prisma/schema.prisma`

Base locale:

```txt
postgresql://auth_user:auth_password@auth-postgres:5432/auth_db?schema=public
```

#### Table `users`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `id` | string UUID | primary key, default uuid | Identifiant auth |
| `email` | string | unique | Email de connexion |
| `passwordHash` | string | required | Mot de passe hashe |
| `createdAt` | datetime | default now | Date de creation |
| `updatedAt` | datetime | auto update | Date de modification |

Exemple:

```json
{
  "id": "user-id",
  "email": "ada@example.com",
  "createdAt": "2026-06-25T00:00:00.000Z",
  "updatedAt": "2026-06-25T00:00:00.000Z"
}
```

#### Table `refresh_tokens`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `id` | string UUID | primary key, default uuid | Identifiant du token |
| `tokenHash` | string | unique | Hash du refresh token |
| `userId` | string UUID | index, FK `users.id` | Proprietaire du token |
| `expiresAt` | datetime | required | Expiration |
| `revokedAt` | datetime/null | optional | Date de revocation |
| `createdAt` | datetime | default now | Date de creation |

Regle importante: la suppression d'un user supprime ses refresh tokens via `onDelete: Cascade`.

### 4.2 user-service

Schema source: `services/user-service/prisma/schema.prisma`

Base locale:

```txt
postgresql://user_user:user_password@user-postgres:5432/user_db?schema=public
```

#### Enums

```txt
Role = ADMIN | MODERATOR | USER
Statuts = ACTIVE | INACTIVE
```

#### Table `users_state`

Modele Prisma: `User_state`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `id_user` | string | primary key | Id utilisateur venant de auth-service |
| `role` | enum `Role` | default `USER` | Role applicatif |
| `statuts` | enum `Statuts` | default `ACTIVE` | Etat du compte |

Exemple:

```json
{
  "id_user": "user-id",
  "role": "USER",
  "statuts": "ACTIVE"
}
```

#### Table `content_reports`

Modele Prisma: `ContentReport`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `id` | string UUID | primary key, default uuid | Identifiant du signalement |
| `message` | string | required | Message du signalement |
| `postId` | string/null | optional | Post signale |
| `commentId` | string/null | optional | Commentaire signale |
| `reportedUserId` | string/null | optional | Utilisateur signale |
| `createdAt` | datetime | default now | Date de creation |
| `updatedAt` | datetime | auto update | Date de modification |

Regle API: exactement une cible doit etre fournie a la creation parmi `postId`, `commentId`, `reportedUserId`.

### 4.3 follow-service

Schema source: `services/follow-service/prisma/schema.prisma`

Base locale:

```txt
postgresql://follow_user:follow_password@follow-postgres:5432/follow_db?schema=public
```

#### Table `follows`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `id` | UUID | primary key, default uuid | Identifiant de la relation |
| `follower_id` | varchar(255) | required | Utilisateur qui suit |
| `following_id` | varchar(255) | required | Utilisateur suivi |
| `created_at` | datetime | default now | Date de creation |

Contrainte:

```sql
UNIQUE(follower_id, following_id)
```

Regles metier:

- un utilisateur ne peut pas se suivre lui-meme;
- un utilisateur ne peut pas suivre deux fois la meme personne;
- un unfollow supprime uniquement la paire `follower_id` / `following_id`.

## 5. MongoDB

### 5.1 profile-service

Schema source: `services/profile-service/src/models/user-info.model.ts`

Base locale:

```txt
mongodb://profile-mongodb:27017/profile_db
```

#### Collection `user_info`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `id_user` | string | required, unique, trim | Id utilisateur auth |
| `username` | string | required, unique, trim | Nom utilisateur public |
| `nickname` | string | default `""`, trim | Nom affiche |
| `bio` | string | default `""`, trim | Biographie |
| `url_photo` | string | default `""`, trim | URL avatar |
| `createdAt` | date | timestamps | Date de creation |
| `updatedAt` | date | timestamps | Date de modification |

Note: `bio` accepte l'alias d'entree `bibliography`. Le JSON de sortie retire `_id`.

Exemple:

```json
{
  "id_user": "user-id",
  "username": "ada",
  "nickname": "Ada",
  "bio": "Hello",
  "url_photo": "https://example.com/avatar.png",
  "createdAt": "2026-06-25T00:00:00.000Z",
  "updatedAt": "2026-06-25T00:00:00.000Z"
}
```

### 5.2 post-service

Schema source: `services/post-service/src/models/post.model.ts`

Base locale:

```txt
mongodb://post-mongodb:27017/post_db
```

#### Collection `posts`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | primary key Mongo | Identifiant du post |
| `authorId` | string | required, index | Auteur du post |
| `content` | string | required, trim, max 280 | Texte du post |
| `tags` | string[] | default `[]` | Tags normalises |
| `media` | array | default `[]`, max 4 via API | Medias attaches |
| `media.id` | string | required | Souvent `objectKey` MinIO |
| `media.type` | `image` ou `video` | required | Type affichable dans un post |
| `media.url` | string | required | URL publique |
| `media.alt` | string | default `""` | Texte alternatif |
| `deletedAt` | date/null | default `null` | Soft delete |
| `createdAt` | date | timestamps | Date de creation |
| `updatedAt` | date | timestamps | Date de modification |

Index:

```js
db.posts.createIndex({ authorId: 1, createdAt: -1 })
```

Exemple:

```json
{
  "id": "post-id",
  "authorId": "user-id",
  "content": "Hello #intro",
  "tags": ["intro"],
  "media": [
    {
      "id": "posts/user-id/file.jpg",
      "type": "image",
      "url": "http://localhost:8080/minio/breezy-media/posts/user-id/file.jpg",
      "alt": "Image"
    }
  ],
  "deletedAt": null,
  "createdAt": "2026-06-25T00:00:00.000Z",
  "updatedAt": "2026-06-25T00:00:00.000Z"
}
```

### 5.3 interaction-service

Schemas sources:

- `services/interaction-service/src/models/post-like.model.ts`
- `services/interaction-service/src/models/comment-like.model.ts`
- `services/interaction-service/src/models/comment.model.ts`

Base locale:

```txt
mongodb://interaction-mongodb:27017/interaction_db
```

#### Collection `post_likes`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `userId` | string | required, trim | Utilisateur qui like |
| `postId` | string | required, trim | Post like |
| `createdAt` | date | timestamp | Date du like |

Index:

```js
db.post_likes.createIndex({ userId: 1, postId: 1 }, { unique: true })
db.post_likes.createIndex({ postId: 1 })
db.post_likes.createIndex({ userId: 1 })
```

#### Collection `comment_likes`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `userId` | string | required, trim | Utilisateur qui like |
| `commentId` | string | required, trim | Commentaire ou reponse like |
| `postId` | string | required, trim | Post parent |
| `createdAt` | date | timestamp | Date du like |

Index:

```js
db.comment_likes.createIndex({ userId: 1, commentId: 1 }, { unique: true })
db.comment_likes.createIndex({ commentId: 1 })
db.comment_likes.createIndex({ postId: 1 })
db.comment_likes.createIndex({ userId: 1 })
```

#### Collection `comments`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | primary key Mongo | Identifiant du commentaire |
| `postId` | string | required, trim, index | Post parent |
| `authorId` | string | required, trim, index | Auteur |
| `parentCommentId` | string/null | default `null`, index | Commentaire parent si reponse |
| `content` | string | required, trim, max 280 | Texte |
| `deletedAt` | date/null | default `null` | Soft delete |
| `createdAt` | date | timestamps | Date de creation |
| `updatedAt` | date | timestamps | Date de modification |

Index:

```js
db.comments.createIndex({ postId: 1, createdAt: -1 })
db.comments.createIndex({ authorId: 1, createdAt: -1 })
```

### 5.4 notification-service

Schema source: `services/notification-service/src/models/notification.model.ts`

Base locale:

```txt
mongodb://notification-mongodb:27017/notification_db
```

#### Collection `notifications`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | primary key Mongo | Identifiant |
| `recipientId` | string | required, trim, index | Destinataire |
| `actorId` | string | required, trim | Utilisateur declencheur |
| `type` | enum | `like`, `mention`, `follow` | Type de notification |
| `resourceType` | enum | `post`, `comment`, `user` | Type de ressource |
| `resourceId` | string | required, trim | Ressource cible |
| `message` | string | required, trim | Message genere |
| `isRead` | boolean | default `false`, index | Etat de lecture |
| `readAt` | date/null | default `null` | Date de lecture |
| `createdAt` | date | timestamp | Date de creation |

Index:

```js
db.notifications.createIndex({ recipientId: 1, createdAt: -1 })
db.notifications.createIndex({ recipientId: 1, isRead: 1 })
```

### 5.5 media-service

Schema source: `services/media-service/src/models/media.model.ts`

Base locale:

```txt
mongodb://media-mongodb:27017/media_db
```

#### Collection `media`

| Champ | Type | Contraintes | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | primary key Mongo | Identifiant metadata |
| `objectKey` | string | required, unique, index | Chemin objet MinIO |
| `mimeType` | string | required | Type MIME |
| `size` | number | required | Taille en octets |
| `originalName` | string | required | Nom original |
| `ownerId` | string | required, index | Proprietaire |
| `usage` | enum | `profile`, `post`, `comment`, `general` | Usage fonctionnel |
| `alt` | string | default `""` | Texte alternatif |
| `type` | enum | `image`, `video`, `file` | Famille du fichier |
| `bucket` | string | required | Bucket MinIO |
| `url` | string | required | URL publique |
| `createdAt` | date | timestamps | Date de creation |
| `updatedAt` | date | timestamps | Date de modification |

## 6. MinIO

Service: `minio`

Bucket par defaut:

```txt
breezy-media
```

Variables principales:

```env
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=breezy-media
MINIO_PUBLIC_URL=http://localhost:8080/minio
```

Le media-service cree des cles selon l'usage:

| Usage | Prefixe d'objet |
| --- | --- |
| `profile` | `profiles/<ownerId>/<uuid>.<ext>` |
| `post` | `posts/<ownerId>/<uuid>.<ext>` |
| `comment` | `comments/<ownerId>/<uuid>.<ext>` |
| `general` | `general/<ownerId>/<uuid>.<ext>` |

Flux d'upload:

```txt
frontend -> POST /api/media/presigned-url
media-service -> cree metadata dans media_db
media-service -> renvoie uploadUrl + objectKey + publicUrl
frontend -> PUT direct sur MinIO avec uploadUrl
frontend -> reference publicUrl/objectKey dans profil ou post
```

MIME types autorises par l'API:

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`
- `video/mp4`
- `video/webm`
- `application/pdf`

Limites:

| Type | Taille max |
| --- | --- |
| Video | 10 GB |
| Autre | 100 MB |

## 7. Services sans base persistante

### API gateway

L'API gateway ne possede pas de base. Elle verifie l'authentification, applique le RBAC, forwarde les requetes et agrege certaines reponses.

### Frontend

Le frontend n'a pas de base serveur propre. Il utilise:

- les APIs via `/api`;
- des cookies HTTP-only pour la session;
- le stockage navigateur pour certaines donnees de chat et preferences UI.

### Chat service

Le chat-service stocke en memoire:

- sockets connectees;
- presence par utilisateur.

Il ne persiste pas les messages dans la version actuelle. Une evolution possible serait d'ajouter une base MongoDB ou PostgreSQL pour conversations/messages et Redis pour la presence distribuee.

## 8. Services anciens ou regroupes

| Ancienne idee | Etat actuel |
| --- | --- |
| `feed-service` | Pas de service dedie. Le feed est construit par l'API gateway avec `follow-service`, `post-service`, `profile-service` et `interaction-service`. |
| `search-service` | Pas de service dedie. La recherche par tag est portee par `post-service` via `/posts/tag/:tag`; la recherche profils est dans `profile-service`. |
| `message-service` | Pas de service REST dedie. La messagerie est dans `chat-service` via Socket.IO, sans persistance serveur. |
| `moderation-service` | Pas de service dedie. Les signalements sont dans `user-service`; les droits sont portes par la gateway. |

## 9. Synthese

```txt
PostgreSQL:
  auth-service    -> auth_db
  user-service    -> user_db
  follow-service  -> follow_db

MongoDB:
  profile-service      -> profile_db
  post-service         -> post_db
  interaction-service  -> interaction_db
  notification-service -> notification_db
  media-service        -> media_db

Objet:
  media-service -> MinIO bucket breezy-media

Memoire:
  chat-service -> presence et messages temps reel non persistants
```


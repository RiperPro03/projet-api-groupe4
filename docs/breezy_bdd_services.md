# Breezy — Proposition des bases de données par service

## Objectif

Ce document définit le type de base de données recommandé pour chaque service du projet **Breezy**.

Le projet utilise uniquement :

- **PostgreSQL** pour les données structurées, relationnelles, sécurisées ou nécessitant des contraintes fortes ;
- **MongoDB** pour les données orientées documents, les contenus évolutifs et les données volumineuses comme les posts, messages ou notifications.

> Redis n'est pas obligatoire dans la première version. Il pourra être ajouté plus tard pour améliorer les performances du feed, du cache ou des sessions.

---

# 1. Vue globale des services

| Service | Rôle principal | BDD recommandée | Justification |
|---|---|---|---|
| `auth-service` | Inscription, connexion, sécurité, tokens | PostgreSQL | Données sensibles, contraintes fortes, unicité email, relations propres |
| `user-service` | Profils utilisateurs, préférences, informations publiques | PostgreSQL | Données structurées, relations avec préférences, paramètres, profil |
| `post-service` | Publications, posts utilisateur, tags, médias | MongoDB | Posts flexibles, contenu évolutif, médias, tags, volume important |
| `feed-service` | Construction du fil d'actualité chronologique | MongoDB | Stockage possible de timelines ou snapshots de feed |
| `interaction-service` | Likes, commentaires, réponses | MongoDB | Interactions nombreuses, documents liés aux posts, volume important |
| `follow-service` | Abonnements entre utilisateurs | PostgreSQL | Relation claire entre utilisateurs, contraintes d'unicité, requêtes relationnelles |
| `search-service` | Recherche de contenu via tags | MongoDB | Recherche sur posts, tags, contenus indexés |
| `notification-service` | Notifications utilisateur | MongoDB | Notifications nombreuses, format flexible, lecture rapide par utilisateur |
| `message-service` | Messages privés | MongoDB | Conversations et messages sous forme de documents |
| `moderation-service` | Signalements et sanctions | PostgreSQL | Données administratives, historiques, sanctions structurées |
| `frontend` | Interface React | Aucune BDD | Le front consomme les API |
| `api-gateway` | Point d'entrée unique | Aucune BDD obligatoire | Routage, sécurité, vérification JWT |

---

# 2. Règle d'architecture

Chaque service possède sa propre base de données logique.

Exemple :

```txt
auth-service        -> PostgreSQL : auth_db
user-service        -> PostgreSQL : user_db
post-service        -> MongoDB    : post_db
interaction-service -> MongoDB    : interaction_db
follow-service      -> PostgreSQL : follow_db
```

Un service ne doit pas accéder directement à la base de données d'un autre service.

Exemple interdit :

```txt
post-service -> lit directement user_db
```

Exemple correct :

```txt
post-service -> appelle user-service via API
```

---

# 3. auth-service

## BDD recommandée

```txt
PostgreSQL
```

## Pourquoi PostgreSQL ?

Le service d'authentification manipule des données sensibles : email, mot de passe hashé, tokens, vérification email. Il faut donc des contraintes fortes et des données bien structurées.

## Tables proposées

### Table `auth_users`

```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password_hash TEXT NOT NULL
is_email_verified BOOLEAN DEFAULT false
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Exemple JSON côté API

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "isEmailVerified": false,
  "isActive": true,
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

### Table `refresh_tokens`

```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
 token_hash TEXT NOT NULL
expires_at TIMESTAMP NOT NULL
revoked_at TIMESTAMP NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Table `email_verification_tokens`

```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
token_hash TEXT NOT NULL
expires_at TIMESTAMP NOT NULL
used_at TIMESTAMP NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Table `password_reset_tokens`

```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
token_hash TEXT NOT NULL
expires_at TIMESTAMP NOT NULL
used_at TIMESTAMP NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

# 4. user-service

## BDD recommandée

```txt
PostgreSQL
```

## Pourquoi PostgreSQL ?

Les profils utilisateurs, préférences, paramètres de langue et thème sont des données structurées. PostgreSQL est adapté pour garantir l'unicité du username et organiser proprement les informations publiques.

## Tables proposées

### Table `users`

```sql
id UUID PRIMARY KEY
username VARCHAR(50) UNIQUE NOT NULL
display_name VARCHAR(100)
bio TEXT
avatar_url TEXT
banner_url TEXT
birth_date DATE NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Exemple JSON

```json
{
  "id": "uuid",
  "username": "Toto",
  "displayName": "Toto",
  "bio": "Développeur web",
  "avatarUrl": "https://cdn.example.com/avatar.png",
  "bannerUrl": "https://cdn.example.com/banner.png",
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

### Table `user_preferences`

```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE NOT NULL
language VARCHAR(10) DEFAULT 'fr'
theme VARCHAR(20) DEFAULT 'light'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Exemple JSON

```json
{
  "userId": "uuid",
  "language": "fr",
  "theme": "dark"
}
```

---

# 5. post-service

## BDD recommandée

```txt
MongoDB
```

## Stockage des médias recommandé

```txt
MinIO
```

## Pourquoi MongoDB ?

Les posts sont des documents avec du contenu flexible : texte, médias, tags, mentions, compteurs et visibilité. MongoDB est adapté aux données semi-structurées et aux volumes importants.

Dans le cas des médias, les fichiers ne sont pas stockés directement dans MongoDB.
MongoDB stocke uniquement les métadonnées des médias : nom du fichier, type, taille, bucket MinIO et clé de l’objet.

## Pourquoi MinIO ?

MinIO permet de stocker les fichiers envoyés par les utilisateurs, comme les images ou vidéos associées aux posts.
Il fonctionne avec une logique compatible S3, basée sur des **buckets** et des **object keys**.

Dans le projet, le `post-service` est responsable de l’upload des médias liés aux posts vers MinIO.

```txt
post-service
├── MongoDB : stocke les posts et les métadonnées des médias
└── MinIO : stocke les fichiers physiques des médias
```

## Bucket MinIO recommandé

```txt
breezy-post-media
```

Ce bucket contient uniquement les fichiers liés aux publications.

Exemples d’objets stockés dans le bucket :

```txt
posts/user_123/post_456/image-1.webp
posts/user_123/post_456/image-2.png
posts/user_789/post_999/video-1.mp4
```

## Collection `posts`

```json
{
  "_id": "ObjectId",
  "authorId": "uuid",
  "content": "Mon premier post sur Breezy",
  "media": [
    {
      "type": "image",
      "bucket": "breezy-post-media",
      "objectKey": "posts/user_123/post_456/image-1.webp",
      "url": "https://cdn.example.com/posts/user_123/post_456/image-1.webp",
      "mimeType": "image/webp",
      "size": 245000,
      "originalName": "photo.webp",
      "alt": "Description de l'image"
    }
  ],
  "tags": ["web", "dev"],
  "mentions": ["uuid-user-2"],
  "likesCount": 0,
  "commentsCount": 0,
  "repostsCount": 0,
  "visibility": "public",
  "isDeleted": false,
  "createdAt": "2026-06-04T10:00:00.000Z",
  "updatedAt": "2026-06-04T10:00:00.000Z"
}
```

## Champs principaux

| Champ                | Type              | Description                                                         |
| -------------------- | ----------------- | ------------------------------------------------------------------- |
| `_id`                | ObjectId          | Identifiant du post                                                 |
| `authorId`           | string UUID       | ID de l'auteur venant du `user-service`                             |
| `content`            | string            | Contenu textuel du post                                             |
| `media`              | array             | Liste des médias associés au post                                   |
| `media.type`         | string            | Type du média : `image`, `video`, `file`                            |
| `media.bucket`       | string            | Nom du bucket MinIO où le fichier est stocké                        |
| `media.objectKey`    | string            | Chemin unique du fichier dans le bucket MinIO                       |
| `media.url`          | string            | URL publique ou signée permettant d’accéder au fichier              |
| `media.mimeType`     | string            | Type MIME du fichier : `image/png`, `image/webp`, `video/mp4`, etc. |
| `media.size`         | number            | Taille du fichier en octets                                         |
| `media.originalName` | string            | Nom original du fichier envoyé par l’utilisateur                    |
| `media.alt`          | string            | Texte alternatif du média, utile pour l’accessibilité               |
| `tags`               | array string      | Tags associés au post                                               |
| `mentions`           | array string UUID | Utilisateurs mentionnés dans le post                                |
| `likesCount`         | number            | Compteur de likes, alimenté par `interaction-service`               |
| `commentsCount`      | number            | Compteur de commentaires, alimenté par `interaction-service`        |
| `repostsCount`       | number            | Compteur de republications                                          |
| `visibility`         | string            | Visibilité du post : `public`, `private`, `followers`               |
| `isDeleted`          | boolean           | Suppression logique du post                                         |
| `createdAt`          | date              | Date de création du post                                            |
| `updatedAt`          | date              | Date de modification du post                                        |

## Rôle de MongoDB et MinIO

| Élément                | Stockage | Description                                        |
| ---------------------- | -------- | -------------------------------------------------- |
| Texte du post          | MongoDB  | Contenu principal de la publication                |
| Tags                   | MongoDB  | Tags utilisés pour la recherche et le classement   |
| Mentions               | MongoDB  | IDs des utilisateurs mentionnés                    |
| Compteurs              | MongoDB  | Nombre de likes, commentaires et reposts           |
| Métadonnées des médias | MongoDB  | Informations nécessaires pour retrouver le fichier |
| Fichiers médias        | MinIO    | Images, vidéos ou fichiers réellement envoyés      |
| Bucket                 | MinIO    | Conteneur logique des fichiers                     |
| Object key             | MinIO    | Chemin unique du fichier dans le bucket            |

## Fonctionnement de l’upload

Lorsqu’un utilisateur publie un post avec un média :

```txt
frontend
→ api-gateway
→ post-service
→ MinIO : stockage du fichier
→ MongoDB : stockage du post et des métadonnées du fichier
```

Le fichier n’est pas enregistré dans MongoDB.
MongoDB conserve uniquement les informations permettant de retrouver le fichier dans MinIO.

## Exemple de configuration MinIO pour le post-service

```env
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_POST_BUCKET=breezy-post-media
```

## Exemple Docker Compose

```yaml
services:
  post-service:
    build: ./services/post-service
    environment:
      MONGO_URL: mongodb://mongo:27017/post_db
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
      MINIO_POST_BUCKET: breezy-post-media
    depends_on:
      - mongo
      - minio

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

## Index recommandés

```js
db.posts.createIndex({ authorId: 1, createdAt: -1 })
db.posts.createIndex({ tags: 1 })
db.posts.createIndex({ createdAt: -1 })
db.posts.createIndex({ content: "text", tags: "text" })
db.posts.createIndex({ "media.objectKey": 1 })
```

## Remarque importante

Le `post-service` gère uniquement les médias liés aux publications.

```txt
Médias de posts      → post-service → bucket breezy-post-media
Photos de profil     → user-service → bucket breezy-user-avatars
Fichiers de messages → message-service → bucket breezy-message-attachments
```

MinIO peut donc être commun à plusieurs services, mais chaque service doit gérer uniquement les fichiers liés à son domaine métier.

---

# 6. feed-service

## BDD recommandée

```txt
MongoDB
```

## Pourquoi MongoDB ?

Le feed peut être calculé dynamiquement au début. Si besoin, il peut stocker des entrées de timeline par utilisateur. MongoDB est adapté pour stocker des listes chronologiques de posts.

## Version avec BDD MongoDB

Collection `feeds` :

```json
{
  "_id": "ObjectId",
  "userId": "uuid",
  "postId": "ObjectId",
  "authorId": "uuid",
  "score": 0,
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

## Index recommandés

```js
db.feeds.createIndex({ userId: 1, createdAt: -1 })
db.feeds.createIndex({ postId: 1 })
```

---

# 7. interaction-service

## BDD recommandée

```txt
MongoDB
```

## Pourquoi MongoDB ?

Les likes, commentaires et réponses peuvent être très nombreux. MongoDB est adapté pour stocker ces interactions sous forme de documents.

## Collection `likes`

Modèle polymorphe (option A) : un like cible un post, un commentaire ou une réponse via `targetType` + `targetId`.

```json
{
  "_id": "ObjectId",
  "userId": "uuid",
  "targetType": "post",
  "targetId": "ObjectId",
  "postId": "ObjectId",
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

| Champ | Description |
|-------|-------------|
| `targetType` | `"post"` \| `"comment"` \| `"reply"` |
| `targetId` | ID de la cible likée |
| `postId` | Contexte du post parent (obligatoire pour `post`, recommandé pour `comment` / `reply`) |

> Un utilisateur peut liker un post **et** un commentaire **et** une réponse. L'unicité porte sur le triplet `(userId, targetType, targetId)`.

## Index recommandés

```js
db.likes.createIndex({ userId: 1, targetType: 1, targetId: 1 }, { unique: true })
db.likes.createIndex({ targetType: 1, targetId: 1 })
db.likes.createIndex({ postId: 1 })
db.likes.createIndex({ userId: 1 })
```

## Collection `comments`

```json
{
  "_id": "ObjectId",
  "postId": "ObjectId",
  "authorId": "uuid",
  "content": "Très intéressant !",
  "likesCount": 0,
  "isDeleted": false,
  "createdAt": "2026-06-04T10:00:00.000Z",
  "updatedAt": "2026-06-04T10:00:00.000Z"
}
```

## Collection `replies`

```json
{
  "_id": "ObjectId",
  "commentId": "ObjectId",
  "postId": "ObjectId",
  "authorId": "uuid",
  "content": "Réponse au commentaire",
  "likesCount": 0,
  "isDeleted": false,
  "createdAt": "2026-06-04T10:00:00.000Z",
  "updatedAt": "2026-06-04T10:00:00.000Z"
}
```

---

# 8. follow-service

## BDD recommandée

```txt
PostgreSQL
```

## Pourquoi PostgreSQL ?

Les abonnements sont des relations entre utilisateurs. PostgreSQL est très adapté pour gérer ce type de relation avec des contraintes d'unicité.

## Table `follows`

```sql
id UUID PRIMARY KEY
follower_id UUID NOT NULL
following_id UUID NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## Contrainte importante

```sql
UNIQUE(follower_id, following_id)
```

## Exemple JSON

```json
{
  "id": "uuid",
  "followerId": "uuid-user-1",
  "followingId": "uuid-user-2",
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

## Règles métier

- Un utilisateur ne peut pas se suivre lui-même.
- Un utilisateur ne peut pas suivre deux fois la même personne.
- La suppression d'un follow correspond à un unfollow.

---

# 9. search-service

## BDD recommandée

```txt
MongoDB
```

## Pourquoi MongoDB ?

Le moteur de recherche peut s'appuyer sur les index texte MongoDB. Pour une première version, il peut rechercher dans les tags et le contenu des posts.

## Collection possible `search_indexes`

```json
{
  "_id": "ObjectId",
  "postId": "ObjectId",
  "authorId": "uuid",
  "content": "Mon premier post sur Breezy",
  "tags": ["web", "dev"],
  "createdAt": "2026-06-04T10:00:00.000Z",
  "indexedAt": "2026-06-04T10:01:00.000Z"
}
```

## Index recommandés

```js
db.search_indexes.createIndex({ content: "text", tags: "text" })
db.search_indexes.createIndex({ tags: 1 })
db.search_indexes.createIndex({ createdAt: -1 })
```

## Version simple

Au début, le `search-service` peut simplement appeler le `post-service` avec des paramètres de recherche.

Exemple :

```txt
GET /search?tag=web
```

---

# 10. notification-service

## BDD recommandée

```txt
MongoDB
```

## Pourquoi MongoDB ?

Les notifications sont nombreuses, simples et avec un format qui peut évoluer selon le type d'événement : like, follow, commentaire, message privé, sanction.

## Collection `notifications`

```json
{
  "_id": "ObjectId",
  "recipientId": "uuid",
  "actorId": "uuid",
  "type": "like",
  "resourceType": "post",
  "resourceId": "ObjectId",
  "message": "Toto a aimé votre post",
  "isRead": false,
  "createdAt": "2026-06-04T10:00:00.000Z",
  "readAt": null
}
```

## Index recommandés

```js
db.notifications.createIndex({ recipientId: 1, createdAt: -1 })
db.notifications.createIndex({ recipientId: 1, isRead: 1 })
```

---

# 11. message-service

## BDD recommandée

```txt
MongoDB
```

## Pourquoi MongoDB ?

Les messages privés et conversations sont très adaptés à un modèle document. Une conversation peut contenir des métadonnées, et les messages peuvent être stockés séparément.

## Collection `conversations`

```json
{
  "_id": "ObjectId",
  "participantIds": ["uuid-user-1", "uuid-user-2"],
  "lastMessage": {
    "content": "Salut !",
    "senderId": "uuid-user-1",
    "createdAt": "2026-06-04T10:00:00.000Z"
  },
  "createdAt": "2026-06-04T09:00:00.000Z",
  "updatedAt": "2026-06-04T10:00:00.000Z"
}
```

## Collection `messages`

```json
{
  "_id": "ObjectId",
  "conversationId": "ObjectId",
  "senderId": "uuid-user-1",
  "content": "Salut !",
  "isRead": false,
  "createdAt": "2026-06-04T10:00:00.000Z",
  "readAt": null
}
```

## Index recommandés

```js
db.conversations.createIndex({ participantIds: 1 })
db.conversations.createIndex({ updatedAt: -1 })
db.messages.createIndex({ conversationId: 1, createdAt: 1 })
```

---

# 12. moderation-service

## BDD recommandée

```txt
PostgreSQL
```

## Pourquoi PostgreSQL ?

La modération demande des données administratives fiables : signalements, sanctions, statuts, historique. PostgreSQL est plus adapté pour garder une traçabilité propre.

## Table `reports`

```sql
id UUID PRIMARY KEY
reporter_id UUID NOT NULL
target_type VARCHAR(50) NOT NULL
target_id VARCHAR(100) NOT NULL
reason VARCHAR(100) NOT NULL
description TEXT
status VARCHAR(50) DEFAULT 'pending'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## Exemple JSON

```json
{
  "id": "uuid",
  "reporterId": "uuid-user-1",
  "targetType": "post",
  "targetId": "ObjectId-post",
  "reason": "harassment",
  "description": "Contenu inapproprié",
  "status": "pending",
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

## Table `sanctions`

```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
type VARCHAR(50) NOT NULL
reason TEXT NOT NULL
start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
end_at TIMESTAMP NULL
created_by UUID NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## Exemple JSON

```json
{
  "id": "uuid",
  "userId": "uuid-user-2",
  "type": "temporary_ban",
  "reason": "Non-respect des règles",
  "startAt": "2026-06-04T10:00:00.000Z",
  "endAt": "2026-06-11T10:00:00.000Z"
}
```

---



## PostgreSQL

```txt
postgres
├── auth_db
├── user_db
├── follow_db
└── moderation_db
```

## MongoDB

```txt
mongo
├── post_db
├── feed_db
├── interaction_db
├── search_db
├── notification_db
└── message_db
```

Cela reste simple à lancer en Docker, tout en gardant une séparation logique entre les services.

---

```txt
auth-db        -> volume auth_db_data
user-db        -> volume user_db_data
post-db        -> volume post_db_data
interaction-db -> volume interaction_db_data
follow-db      -> volume follow_db_data
```

---

## Synthèse

```txt
PostgreSQL = auth, users, follows, moderation
MongoDB    = posts, feed, interactions, search, notifications, messages
```

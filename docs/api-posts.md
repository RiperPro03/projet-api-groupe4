# API Posts

Base publique: `/api/posts`

Les routes de lecture passent par la gateway et sont enrichies avec profil auteur, likes et compte de commentaires.

## Routes

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/posts?authorId=:id&limit=5&cursor=:postId` | Token | Posts d'un auteur. |
| `GET` | `/posts/all?limit=5&cursor=:postId` | Token | Tous les posts non supprimes. |
| `GET` | `/posts/feed?limit=5&cursor=:postId` | Token | Feed courant: soi + utilisateurs suivis. |
| `GET` | `/posts/tag/:tag?limit=5&cursor=:postId` | Token | Posts contenant un tag. |
| `GET` | `/posts/:id` | Token | Detail d'un post. |
| `POST` | `/posts` | Auteur du body ou `MODERATOR`/`ADMIN` | Cree un post. |
| `PATCH` | `/posts/:id` | Auteur du post ou `MODERATOR`/`ADMIN` | Met a jour un post. |
| `DELETE` | `/posts/:id` | Auteur du post ou `MODERATOR`/`ADMIN` | Soft delete un post et nettoie ses interactions. |

## Pagination

Parametres:

| Parametre | Type | Defaut | Notes |
| --- | --- | --- | --- |
| `limit` | number | `5` | Force entre 1 et 50 cote service. |
| `cursor` | string | `null` | Id du dernier post recu. |

Reponse page:

```json
{
  "status": "success",
  "message": "Posts retrieved",
  "data": {
    "posts": [],
    "nextCursor": null,
    "hasMore": false
  }
}
```

## Modele Post enrichi

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
      "url": "https://example.com/minio/breezy-media/posts/user-id/file.jpg",
      "alt": "Image description"
    }
  ],
  "createdAt": "2026-06-25T00:00:00.000Z",
  "updatedAt": "2026-06-25T00:00:00.000Z",
  "deletedAt": null,
  "author": {
    "id": "user-id",
    "name": "Ada",
    "username": "ada",
    "avatarUrl": "https://example.com/avatar.png"
  },
  "likesCount": 3,
  "commentsCount": 1,
  "isLiked": true,
  "likers": []
}
```

## Creer un post

`POST /api/posts`

```json
{
  "authorId": "user-id",
  "content": "Hello #intro",
  "tags": ["intro"],
  "media": [
    {
      "id": "posts/user-id/file.jpg",
      "type": "image",
      "url": "https://example.com/minio/breezy-media/posts/user-id/file.jpg",
      "alt": "Image description"
    }
  ]
}
```

Contraintes:

| Champ | Type | Requis | Notes |
| --- | --- | --- | --- |
| `authorId` | string | Oui | Doit etre l'utilisateur courant, sauf moderation. |
| `content` | string | Oui | Non vide, max 280 caracteres. |
| `tags` | string[] | Non | Fusionnes avec les hashtags detectes dans `content`. |
| `media` | array | Non | Max 4 items. Type `image` ou `video`. |

Reponse `201`:

```json
{
  "status": "success",
  "message": "Post created",
  "data": {
    "post": {
      "id": "post-id",
      "authorId": "user-id",
      "content": "Hello #intro",
      "tags": ["intro"],
      "media": [],
      "createdAt": "2026-06-25T00:00:00.000Z",
      "updatedAt": "2026-06-25T00:00:00.000Z",
      "deletedAt": null
    }
  }
}
```

## Mettre a jour un post

`PATCH /api/posts/:id`

Le middleware actuel valide `content` comme requis et non vide, meme pour un `PATCH`.

```json
{
  "content": "Contenu modifie",
  "tags": ["update"],
  "media": []
}
```

## Supprimer un post

`DELETE /api/posts/:id`

Le post est marque avec `deletedAt`. Le post-service appelle ensuite l'interaction-service pour supprimer commentaires, likes de post et likes de commentaires lies au post.

## Erreurs

| Code | Cas |
| --- | --- |
| `400` | `authorId`, `content`, `authorId` query ou `tag` manquant. |
| `401` | Non authentifie. |
| `403` | Ni auteur ni role de moderation. |
| `404` | Post introuvable. |


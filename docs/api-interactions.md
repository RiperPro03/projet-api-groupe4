# API Interactions

Les routes d'interactions sont exposees a la racine de l'API gateway, pas sous `/interactions`.

Base publique: `/api`

## Likes de posts

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/posts/likes` | Proprio de `userId` | Like un post. |
| `DELETE` | `/posts/likes` | Proprio de `userId` | Retire un like de post. |
| `GET` | `/posts/likes?postId=:id&limit=5` | Token | Liste les derniers likers d'un post. |
| `GET` | `/posts/likes/count?postId=:id` | Token | Compte les likes d'un post. |
| `GET` | `/posts/likes/status?userId=:id&postId=:id` | Proprio de `userId` | Indique si l'utilisateur a like un post. |
| `GET` | `/posts/likes/status?userId=:id&postIds=a,b` | Proprio de `userId` | Liste les post ids likes parmi une liste. |

Creer un like:

```json
{
  "userId": "user-id",
  "postId": "post-id"
}
```

Reponses:

```json
{
  "count": 3
}
```

```json
{
  "isLiked": true
}
```

```json
{
  "likedIds": ["post-id-1", "post-id-2"]
}
```

```json
{
  "userIds": ["user-id-1", "user-id-2"]
}
```

## Commentaires

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/comments?postId=:id` | Token | Liste les commentaires d'un post, enrichis par la gateway. |
| `GET` | `/comments?authorId=:id` | Token | Liste les commentaires d'un auteur, enrichis par la gateway. |
| `POST` | `/comments` | Proprio de `authorId` | Cree un commentaire ou une reponse. |
| `GET` | `/comments/:commentId/replies` | Token | Liste les reponses d'un commentaire, enrichies par la gateway. |
| `GET` | `/comments/:commentId` | Token | Detail brut d'un commentaire. |
| `DELETE` | `/comments/:commentId` | Auteur du commentaire ou `MODERATOR`/`ADMIN` | Soft delete un commentaire. |

Creer un commentaire:

```json
{
  "postId": "post-id",
  "authorId": "user-id",
  "content": "Bravo !",
  "parentCommentId": null
}
```

Pour une reponse, mettre `parentCommentId` avec l'id du commentaire parent.

Contraintes:

| Champ | Type | Requis | Notes |
| --- | --- | --- | --- |
| `postId` | string | Oui | Post cible. |
| `authorId` | string | Oui | Doit etre l'utilisateur courant. |
| `content` | string | Oui | Non vide, max 280 caracteres en base. |
| `parentCommentId` | string/null | Non | `null` pour commentaire racine. |

Commentaire enrichi par la gateway:

```json
{
  "id": "comment-id",
  "postId": "post-id",
  "authorId": "user-id",
  "parentCommentId": null,
  "content": "Bravo !",
  "createdAt": "2026-06-25T00:00:00.000Z",
  "updatedAt": "2026-06-25T00:00:00.000Z",
  "deletedAt": null,
  "author": {
    "id": "user-id",
    "name": "Ada",
    "username": "ada",
    "avatarUrl": "https://example.com/avatar.png"
  },
  "likesCount": 2,
  "repliesCount": 1,
  "isLiked": false
}
```

Reponse de liste:

```json
{
  "status": "success",
  "message": "Comments retrieved",
  "data": {
    "comments": []
  }
}
```

## Likes de commentaires

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/comments/likes` | Proprio de `userId` | Like un commentaire. |
| `DELETE` | `/comments/likes` | Proprio de `userId` | Retire un like de commentaire. |
| `GET` | `/comments/likes/count?commentId=:id` | Token | Compte les likes d'un commentaire. |
| `GET` | `/comments/likes/status?userId=:id&commentId=:id` | Proprio de `userId` | Indique si l'utilisateur a like un commentaire. |
| `GET` | `/comments/likes/status?userId=:id&commentIds=a,b` | Proprio de `userId` | Liste les comment ids likes parmi une liste. |

Creer un like de commentaire:

```json
{
  "userId": "user-id",
  "commentId": "comment-id",
  "postId": "post-id"
}
```

Supprimer un like de commentaire:

```json
{
  "userId": "user-id",
  "commentId": "comment-id"
}
```

## Stubs de reponses

La gateway expose aussi:

| Route | Etat actuel |
| --- | --- |
| `/replies/likes` | Route forwardee par la gateway, mais pas de handler dedie dans l'interaction-service actuel. |
| `/replies/likes/count` | Route forwardee par la gateway, mais pas de handler dedie dans l'interaction-service actuel. |

Ces routes risquent donc de retourner `404` tant que le service ne les implemente pas.

## Erreurs courantes

Les interactions peuvent retourner:

```json
{
  "error": "Like introuvable"
}
```

ou:

```json
{
  "error": "postId est requis"
}
```

Codes frequents: `400`, `403`, `404`, `409`, `500`.


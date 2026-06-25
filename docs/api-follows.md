# API Follows

Base publique: `/api/follows`

Toutes les routes metier demandent un token, sauf le healthcheck.

## Routes

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/follows` | Proprio de `followerId` | Cree une relation follower -> following. |
| `DELETE` | `/follows` | Proprio de `followerId` | Supprime une relation follower -> following. |
| `GET` | `/follows/following?followerId=:id` | Token | Liste les utilisateurs suivis par `followerId`. |
| `GET` | `/follows/followers?followingId=:id` | Token | Liste les abonnes de `followingId`. |

## Suivre un utilisateur

`POST /api/follows`

```json
{
  "followerId": "current-user-id",
  "followingId": "target-user-id"
}
```

Reponse `201`:

```json
{
  "id": "follow-id",
  "follower_id": "current-user-id",
  "following_id": "target-user-id",
  "created_at": "2026-06-25T00:00:00.000Z"
}
```

Contraintes:

- `followerId` et `followingId` sont requis.
- Un utilisateur ne peut pas se suivre lui-meme.
- La paire `follower_id` / `following_id` est unique.

## Ne plus suivre

`DELETE /api/follows`

```json
{
  "followerId": "current-user-id",
  "followingId": "target-user-id"
}
```

Reponse:

```json
{
  "message": "Abonnement supprime"
}
```

## Listes

`GET /api/follows/following?followerId=current-user-id`

`GET /api/follows/followers?followingId=target-user-id`

Reponse:

```json
[
  {
    "id": "follow-id",
    "follower_id": "current-user-id",
    "following_id": "target-user-id",
    "created_at": "2026-06-25T00:00:00.000Z"
  }
]
```

## Erreurs

| Code | Cas |
| --- | --- |
| `400` | Id manquant ou tentative de self-follow. |
| `403` | `followerId` ne correspond pas a l'utilisateur authentifie. |
| `404` | Relation introuvable au delete. |
| `409` | Relation deja existante. |

Format d'erreur du follow-service:

```json
{
  "error": "Cet abonnement existe deja"
}
```


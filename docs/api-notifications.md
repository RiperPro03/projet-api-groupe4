# API Notifications

Base publique: `/api/notifications`

Toutes les routes metier demandent un token.

## Routes

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/notifications` | Token | Cree une notification. |
| `GET` | `/notifications?recipientId=:id&limit=20&cursor=:id&unreadOnly=true` | Token | Liste les notifications d'un destinataire. |
| `GET` | `/notifications/unread-count?recipientId=:id` | Token | Compte les notifications non lues. |
| `PATCH` | `/notifications/read-all` | Token | Marque toutes les notifications d'un destinataire comme lues. |
| `PATCH` | `/notifications/:id/read` | Token | Marque une notification comme lue. |
| `DELETE` | `/notifications/:id` | Token | Supprime une notification. |

Note: la gateway authentifie la requete mais ne force pas actuellement `recipientId` a correspondre a l'utilisateur du token.

## Types

`type` accepte:

- `like`
- `mention`
- `follow`

`resourceType` accepte:

- `post`
- `comment`
- `user`

Regles:

- Pour `follow`, `resourceType` doit etre `user`.
- Pour `follow`, `resourceId` doit correspondre a `actorId`.
- Pour `like` et `mention`, `resourceType` doit etre `post` ou `comment`.
- `recipientId` et `actorId` doivent etre differents.

## Creer une notification

`POST /api/notifications`

```json
{
  "recipientId": "target-user-id",
  "actorId": "actor-user-id",
  "type": "like",
  "resourceType": "post",
  "resourceId": "post-id"
}
```

Reponse `201`:

```json
{
  "status": "success",
  "message": "Notification created",
  "data": {
    "notification": {
      "id": "notification-id",
      "recipientId": "target-user-id",
      "actorId": "actor-user-id",
      "type": "like",
      "resourceType": "post",
      "resourceId": "post-id",
      "message": "Un utilisateur a aime votre post",
      "isRead": false,
      "createdAt": "2026-06-25T00:00:00.000Z",
      "readAt": null
    }
  }
}
```

## Lister les notifications

`GET /api/notifications?recipientId=target-user-id&limit=20&cursor=notification-id&unreadOnly=true`

Parametres:

| Parametre | Type | Defaut | Notes |
| --- | --- | --- | --- |
| `recipientId` | string | Aucun | Requis. |
| `limit` | number | `20` | Force entre 1 et 100. |
| `cursor` | string | `null` | Id de notification pour paginer. |
| `unreadOnly` | boolean string | `false` | `true` ou `1` filtre les non lues. |

Reponse:

```json
{
  "status": "success",
  "message": "Notifications retrieved",
  "data": {
    "notifications": [],
    "nextCursor": null,
    "hasMore": false
  }
}
```

## Compter les non lues

`GET /api/notifications/unread-count?recipientId=target-user-id`

```json
{
  "status": "success",
  "message": "Unread count retrieved",
  "data": {
    "count": 3
  }
}
```

## Marquer comme lu

`PATCH /api/notifications/:id/read`

Reponse:

```json
{
  "status": "success",
  "message": "Notification marked as read",
  "data": {
    "notification": {}
  }
}
```

`PATCH /api/notifications/read-all`

```json
{
  "recipientId": "target-user-id"
}
```

Reponse:

```json
{
  "status": "success",
  "message": "Notifications marked as read",
  "data": {
    "updatedCount": 4
  }
}
```

## Erreurs

Format:

```json
{
  "error": "recipientId est requis"
}
```

Codes frequents: `400`, `401`, `404`, `500`.

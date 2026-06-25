# API Users

Base publique: `/api/users`

Ce domaine couvre deux ressources internes du user-service:

- Etats utilisateurs: role et statut.
- Signalements de contenu: posts, commentaires ou utilisateurs signales.

## Roles et statuts

Roles valides: `ADMIN`, `MODERATOR`, `USER`

Statuts valides: `ACTIVE`, `INACTIVE`

## Routes etats utilisateurs

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/users` | `ADMIN` | Cree un etat utilisateur. |
| `GET` | `/users/:id_user` | Proprio, `MODERATOR`, `ADMIN` | Retourne l'etat d'un utilisateur. |
| `GET` | `/users/by-role/:role` | Token | Liste les utilisateurs actifs d'un role. |
| `PUT` | `/users/:id_user` | `MODERATOR`, `ADMIN` | Met a jour role et/ou statut. |
| `DELETE` | `/users/:id_user` | `ADMIN` | Supprime un etat utilisateur. |

Notes de moderation:

- Un `MODERATOR` ne peut pas cibler un `ADMIN`.
- Un `MODERATOR` ne peut pas se promouvoir ni attribuer le role `ADMIN`.

## Creer un etat utilisateur

`POST /api/users`

```json
{
  "id_user": "user-id",
  "role": "USER",
  "statuts": "ACTIVE"
}
```

Champs:

| Champ | Type | Requis | Notes |
| --- | --- | --- | --- |
| `id_user` | string | Oui | Identifiant utilisateur auth. |
| `role` | enum | Non | Defaut DB: `USER`. |
| `statuts` | enum | Non | Defaut DB: `ACTIVE`. |

Reponse:

```json
{
  "status": "success",
  "message": "User state created successfully",
  "data": {
    "id_user": "user-id",
    "role": "USER",
    "statuts": "ACTIVE"
  }
}
```

## Mettre a jour un etat utilisateur

`PUT /api/users/:id_user`

Au moins un champ est requis:

```json
{
  "role": "MODERATOR",
  "statuts": "ACTIVE"
}
```

## Routes signalements

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/users/reports` | Token | Cree un signalement. |
| `GET` | `/users/reports` | `MODERATOR`, `ADMIN` | Liste les signalements. |
| `GET` | `/users/reports/:id` | `MODERATOR`, `ADMIN` | Detail d'un signalement. |
| `PUT` | `/users/reports/:id` | `MODERATOR`, `ADMIN` | Met a jour un signalement. |
| `DELETE` | `/users/reports/:id` | `MODERATOR`, `ADMIN` | Supprime un signalement. |

## Creer un signalement

`POST /api/users/reports`

Il faut fournir `message` et exactement une cible parmi `postId`, `commentId`, `reportedUserId`.

```json
{
  "message": "Contenu inapproprie",
  "postId": "post-id"
}
```

Autres exemples valides:

```json
{
  "message": "Commentaire abusif",
  "commentId": "comment-id"
}
```

```json
{
  "message": "Profil suspect",
  "reportedUserId": "user-id"
}
```

Reponse:

```json
{
  "status": "success",
  "message": "Content report created successfully",
  "data": {
    "id": "report-id",
    "message": "Contenu inapproprie",
    "postId": "post-id",
    "commentId": null,
    "reportedUserId": null,
    "createdAt": "2026-06-25T00:00:00.000Z",
    "updatedAt": "2026-06-25T00:00:00.000Z"
  }
}
```

## Mettre a jour un signalement

`PUT /api/users/reports/:id`

Au moins un champ est requis. Si une cible est fournie, une seule cible est acceptee.

```json
{
  "message": "Nouveau message",
  "commentId": "comment-id"
}
```

## Erreurs de validation

Les validateurs Zod retournent:

```json
{
  "status": "error",
  "message": "Invalid request data",
  "errors": [
    {
      "path": "message",
      "message": "message is required"
    }
  ]
}
```


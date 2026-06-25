# API Auth

Base publique: `/api`

## Routes

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public ou `ADMIN` | Cree un compte auth, un profil et un etat utilisateur par defaut. |
| `POST` | `/auth/login` | Public | Connecte un utilisateur et renvoie les tokens. Refuse les comptes `INACTIVE`. |
| `POST` | `/auth/refresh-token` | Public | Renouvelle les tokens depuis le body ou le cookie `refreshToken`. |
| `DELETE` | `/auth/session` | Public | Supprime les cookies `accessToken` et `refreshToken` cote gateway. |
| `GET` | `/auth/verify` | Token | Verifie le token courant. |
| `GET` | `/auth/me` | Token | Retourne l'utilisateur auth courant. |
| `GET` | `/me` | Token | Retourne auth + etat utilisateur + profil agrege. |
| `GET` | `/auth` | `ADMIN` | Liste les utilisateurs auth. |
| `GET` | `/auth/:id` | Proprio ou `ADMIN` | Retourne un utilisateur auth par id. |
| `POST` | `/auth/logout` | Token | Revoque le refresh token fourni. |
| `PATCH` | `/auth/password` | Token | Change le mot de passe et revoque les refresh tokens actifs. |

## Register

`POST /api/auth/register`

Body:

```json
{
  "email": "ada@example.com",
  "password": "password123",
  "username": "ada",
  "nickname": "Ada",
  "bio": "Hello",
  "url_photo": "https://example.com/avatar.png"
}
```

Champs:

| Champ | Type | Requis | Notes |
| --- | --- | --- | --- |
| `email` | string | Oui | Format email valide. |
| `password` | string | Oui | Minimum 8 caracteres. |
| `username` | string | Oui | Requis par la gateway pour creer le profil. |
| `nickname` | string | Non | Defaut vide. |
| `bio` | string | Non | Alias accepte: `bibliography`. |
| `url_photo` | string | Non | Defaut vide. |

Reponse `201`:

```json
{
  "status": "success",
  "message": "User registered",
  "data": {
    "user": {
      "id": "user-id",
      "email": "ada@example.com",
      "createdAt": "2026-06-25T00:00:00.000Z",
      "updatedAt": "2026-06-25T00:00:00.000Z"
    }
  }
}
```

## Login

`POST /api/auth/login`

Body:

```json
{
  "email": "ada@example.com",
  "password": "password123"
}
```

Reponse `200`:

```json
{
  "status": "success",
  "message": "User logged in",
  "data": {
    "user": {
      "id": "user-id",
      "email": "ada@example.com"
    },
    "accessToken": "jwt",
    "refreshToken": "refresh-token"
  }
}
```

Erreurs utiles:

| Code | Cas |
| --- | --- |
| `400` | Champs manquants ou types invalides. |
| `401` | Identifiants invalides. |
| `403` | Compte suspendu (`statuts = INACTIVE`). |

## Refresh token

`POST /api/auth/refresh-token`

Body optionnel si le cookie `refreshToken` existe:

```json
{
  "refreshToken": "refresh-token"
}
```

Reponse `200`:

```json
{
  "status": "success",
  "message": "Token refreshed",
  "data": {
    "accessToken": "new-jwt",
    "refreshToken": "new-refresh-token"
  }
}
```

La gateway pose aussi les cookies HTTP-only `accessToken` et `refreshToken` quand la reponse contient les deux tokens.

## Utilisateur courant

`GET /api/me`

Reponse `200`:

```json
{
  "status": "success",
  "data": {
    "auth": {
      "id": "user-id",
      "email": "ada@example.com"
    },
    "user": {
      "id_user": "user-id",
      "role": "USER",
      "statuts": "ACTIVE"
    },
    "profile": {
      "id_user": "user-id",
      "username": "ada",
      "nickname": "Ada",
      "bio": "Hello",
      "url_photo": ""
    }
  }
}
```

## Logout et mot de passe

`POST /api/auth/logout`

```json
{
  "refreshToken": "refresh-token"
}
```

`PATCH /api/auth/password`

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password123"
}
```

Contraintes du nouveau mot de passe:

- Minimum 8 caracteres.
- Different du mot de passe courant.


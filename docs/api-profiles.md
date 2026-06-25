# API Profiles

Base publique: `/api/profiles`

Toutes les routes metier de profils passent par l'authentification gateway, sauf le healthcheck.

## Routes

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/profiles` | Token | Liste les profils, du plus recent au plus ancien. |
| `GET` | `/profiles/search?username=ada` | Token | Recherche partielle et insensible a la casse sur `username`. |
| `GET` | `/profiles/username/:username` | Token | Profil par username exact. |
| `GET` | `/profiles/:id_user` | Token | Profil par id utilisateur. |
| `POST` | `/profiles` | Proprio de `id_user` ou `ADMIN` | Cree un profil. |
| `PUT` | `/profiles/:id_user` | Proprio ou `ADMIN` | Remplace/met a jour un profil. |
| `PATCH` | `/profiles/:id_user` | Proprio ou `ADMIN` | Met a jour un profil. |
| `DELETE` | `/profiles/:id_user` | `ADMIN` | Supprime un profil. |

## Modele Profile

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

## Creer un profil

`POST /api/profiles`

```json
{
  "id_user": "user-id",
  "username": "ada",
  "nickname": "Ada",
  "bio": "Hello",
  "url_photo": "https://example.com/avatar.png"
}
```

Champs:

| Champ | Type | Requis | Notes |
| --- | --- | --- | --- |
| `id_user` | string | Oui | Doit correspondre au user auth, sauf `ADMIN`. |
| `username` | string | Oui | Unique. |
| `nickname` | string | Non | Transforme en chaine vide si absent. |
| `bio` | string | Non | Alias accepte: `bibliography`. |
| `url_photo` | string | Non | Transforme en chaine vide si absent. |

Reponse `201`:

```json
{
  "status": "success",
  "message": "Profile created successfully",
  "data": {
    "id_user": "user-id",
    "username": "ada",
    "nickname": "Ada",
    "bio": "Hello",
    "url_photo": "https://example.com/avatar.png"
  }
}
```

## Mettre a jour un profil

`PUT /api/profiles/:id_user` ou `PATCH /api/profiles/:id_user`

Au moins un champ est requis:

```json
{
  "username": "ada-lovelace",
  "nickname": "Ada Lovelace",
  "bio": "Mathematicienne",
  "url_photo": "https://example.com/new-avatar.png"
}
```

## Recherche

`GET /api/profiles/search?username=ad`

Reponse:

```json
{
  "status": "success",
  "data": [
    {
      "id_user": "user-id",
      "username": "ada",
      "nickname": "Ada",
      "bio": "Hello",
      "url_photo": ""
    }
  ]
}
```

La recherche renvoie au maximum 10 profils.

## Erreurs

| Code | Cas |
| --- | --- |
| `400` | Payload invalide ou aucun champ a mettre a jour. |
| `404` | Profil introuvable. |
| `409` | `id_user` ou `username` deja existant. |


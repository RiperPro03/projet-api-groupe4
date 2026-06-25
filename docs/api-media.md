# API Media

Base publique: `/api/media`

Le media-service genere des URL presignees MinIO. L'upload binaire se fait ensuite directement vers `uploadUrl`, hors API gateway.

## Routes

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/media/presigned-url` | Token | Genere une URL temporaire d'upload. |
| `GET` | `/media/:objectKey` | Token | Retourne les metadonnees d'un fichier. |
| `DELETE` | `/media/:objectKey` | Proprietaire du media | Supprime le fichier MinIO et ses metadonnees. |

## Generer une URL presignee

`POST /api/media/presigned-url`

```json
{
  "filename": "avatar.png",
  "mimeType": "image/png",
  "size": 102400,
  "usage": "profile",
  "alt": "Avatar"
}
```

Champs:

| Champ | Type | Requis | Notes |
| --- | --- | --- | --- |
| `filename` | string | Oui | Nom original du fichier. |
| `mimeType` | enum | Oui | Voir liste ci-dessous. |
| `size` | number | Oui | Taille en octets, strictement positive. |
| `usage` | enum | Non | `profile`, `post`, `comment`, `general`. Defaut: `general`. |
| `alt` | string | Non | Texte alternatif stocke en metadata. |

MIME types autorises:

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`
- `video/mp4`
- `video/webm`
- `application/pdf`

Limites de taille:

| Type | Limite |
| --- | --- |
| Video | 10 GB |
| Autres fichiers | 100 MB |

Reponse `201`:

```json
{
  "status": "success",
  "message": "Presigned URL generated",
  "data": {
    "uploadUrl": "https://example.com/minio/breezy-media/posts/user-id/file.jpg?signature=...",
    "objectKey": "posts/user-id/file.jpg",
    "publicUrl": "https://example.com/minio/breezy-media/posts/user-id/file.jpg",
    "expiresIn": 300
  }
}
```

Etape suivante cote client:

```http
PUT <uploadUrl>
Content-Type: image/png

<binary file>
```

## Recuperer un media

`GET /api/media/:objectKey`

Si `objectKey` contient des `/`, il doit etre URL-encode dans le chemin.

Exemple:

```text
GET /api/media/posts%2Fuser-id%2Ffile.jpg
```

Reponse:

```json
{
  "status": "success",
  "message": "Media retrieved",
  "data": {
    "media": {
      "id": "mongo-id",
      "objectKey": "posts/user-id/file.jpg",
      "mimeType": "image/png",
      "size": 102400,
      "originalName": "avatar.png",
      "ownerId": "user-id",
      "usage": "post",
      "alt": "Avatar",
      "type": "image",
      "bucket": "breezy-media",
      "url": "https://example.com/minio/breezy-media/posts/user-id/file.jpg",
      "createdAt": "2026-06-25T00:00:00.000Z",
      "updatedAt": "2026-06-25T00:00:00.000Z"
    }
  }
}
```

## Supprimer un media

`DELETE /api/media/:objectKey`

Le header `x-user-id` est ajoute par la gateway depuis le token. Le media-service verifie que `ownerId` correspond.

Erreurs:

| Code | Cas |
| --- | --- |
| `400` | Body invalide lors de la generation d'URL. |
| `401` | Utilisateur authentifie manquant. |
| `403` | L'utilisateur n'est pas proprietaire du media. |
| `404` | Media introuvable. |


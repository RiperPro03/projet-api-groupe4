# Documentation API Breezy

Cette documentation decrit les routes HTTP publiques exposees par l'API gateway et le reverse proxy, ainsi que le canal Socket.IO du chat.

Sources utilisees: `apps/api-gateway/src/routes`, `apps/api-gateway/src/controllers`, `services/*/src/routes`, `services/*/src/controllers` et `services/chat-service/src/websocket`.

## Bases d'appel

| Contexte | Base URL | Notes |
| --- | --- | --- |
| Frontend / navigateur | `/api` | Nginx retire le prefixe avant l'API gateway. |
| Dev local courant | `http://localhost:8080/api` | Valeur typique de `NEXT_PUBLIC_API_URL` / `INTERNAL_API_URL`. |
| API gateway directe | `http://localhost:3000` | Sans prefixe `/api`. |
| Chat Socket.IO | `/chat/socket.io` | Expose par Nginx hors prefixe `/api`. |

## Authentification

La gateway accepte un token JWT via:

- Header: `Authorization: Bearer <accessToken>`
- Cookie HTTP-only: `accessToken`

Les roles connus sont `USER`, `MODERATOR` et `ADMIN`.

La plupart des routes retournent `401` si l'utilisateur n'est pas authentifie et `403` si son role ou son ownership ne suffit pas.

## Format general

Les services ne sont pas totalement homogenes. Les formats les plus courants sont:

```json
{
  "status": "success",
  "message": "Optional message",
  "data": {}
}
```

Certaines routes d'interactions et de follows retournent directement `{ "count": 1 }`, `{ "userIds": [] }`, un tableau, ou `{ "error": "..." }`.

## Fichiers

| Fichier | Domaine |
| --- | --- |
| [api-auth.md](api-auth.md) | Authentification, session, utilisateur courant |
| [api-users.md](api-users.md) | Etats utilisateurs et signalements |
| [api-profiles.md](api-profiles.md) | Profils publics |
| [api-posts.md](api-posts.md) | Posts, feed, tags |
| [api-interactions.md](api-interactions.md) | Likes, commentaires, reponses |
| [api-follows.md](api-follows.md) | Abonnements |
| [api-media.md](api-media.md) | Uploads MinIO et medias |
| [api-notifications.md](api-notifications.md) | Notifications |
| [api-chat.md](api-chat.md) | Chat temps reel Socket.IO |

## Healthchecks

| Route | Description |
| --- | --- |
| `GET /health` | Healthcheck Nginx public. |
| `GET /api/health` | Healthcheck API gateway. |
| `GET /api/auth/health` | Healthcheck auth-service via gateway. |
| `GET /api/auth/health/db` | Healthcheck DB auth-service. |
| `GET /api/users/health` | Healthcheck user-service. |
| `GET /api/users/health/db` | Healthcheck DB user-service. |
| `GET /api/profiles/health` | Healthcheck profile-service. |
| `GET /api/posts/health` | Healthcheck post-service. |
| `GET /api/media/health` | Healthcheck media-service. |
| `GET /api/media/health/db` | Healthcheck DB media-service. |
| `GET /api/follows/health` | Healthcheck follow-service. |
| `GET /chat/health` | Healthcheck chat-service. |

Note: le notification-service possede un healthcheck interne `GET /health`, mais la route publique via gateway n'est pas listee ici car la config Nginx interne actuelle route surtout `/notifications/*` vers les routes metier du service.

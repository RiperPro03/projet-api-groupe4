# API Chat

Le chat est expose via Socket.IO, pas via `/api`.

## Endpoints HTTP

| Methode | Route | Description |
| --- | --- | --- |
| `GET` | `/chat/health` | Healthcheck public du chat-service via Nginx. |

Le service possede aussi `GET /` en direct, mais Nginx public expose surtout le healthcheck et Socket.IO.

## Connexion Socket.IO

Path public:

```text
/chat/socket.io
```

Le client frontend utilise:

```ts
io(window.location.origin, {
  path: "/chat/socket.io",
  withCredentials: true
});
```

Authentification acceptee par le gateway Socket.IO:

- `handshake.auth.token`
- Header `Authorization: Bearer <accessToken>`
- Cookie `accessToken`

Si le token est absent ou invalide, la connexion echoue avec `Unauthorized`.

## Evenements emis par le serveur

| Evenement | Payload | Description |
| --- | --- | --- |
| `chat:connected` | `{ userId, onlineUserIds }` | Confirme la connexion et donne la presence courante. |
| `presence:online` | `{ userId }` | Un utilisateur vient d'apparaitre en ligne. |
| `presence:offline` | `{ userId }` | Un utilisateur n'a plus aucune socket connectee. |
| `private-message` | `PrivateMessage` | Message recu d'un autre utilisateur. |
| `private-message:sent` | `{ message, delivered }` | Confirmation locale d'envoi. |
| `chat:error` | `{ status, code, message }` | Erreur sans callback ack. |

## Evenements recus par le serveur

### presence:list

Payload: aucun.

Ack:

```json
{
  "onlineUserIds": ["user-id-1", "user-id-2"]
}
```

### private-message

Payload:

```json
{
  "toUserId": "target-user-id",
  "content": "Salut",
  "clientMessageId": "optional-client-id"
}
```

Contraintes:

| Champ | Type | Requis | Notes |
| --- | --- | --- | --- |
| `toUserId` | string | Oui | Doit etre different de l'utilisateur courant. |
| `content` | string | Oui | Non vide, max `MESSAGE_MAX_LENGTH` ou 1000 par defaut. |
| `clientMessageId` | string | Non | Renvoye tel quel si present. |

Ack succes:

```json
{
  "status": "success",
  "data": {
    "message": {
      "id": "message-id",
      "fromUserId": "current-user-id",
      "toUserId": "target-user-id",
      "content": "Salut",
      "sentAt": "2026-06-25T00:00:00.000Z",
      "clientMessageId": "optional-client-id"
    },
    "delivered": true
  }
}
```

Ack erreur:

```json
{
  "status": "error",
  "code": "MESSAGE_TOO_LONG",
  "message": "Message cannot exceed 1000 characters"
}
```

Codes d'erreur possibles:

- `INVALID_PAYLOAD`
- `INVALID_RECIPIENT`
- `MESSAGE_TOO_LONG`
- `MESSAGE_FAILED`


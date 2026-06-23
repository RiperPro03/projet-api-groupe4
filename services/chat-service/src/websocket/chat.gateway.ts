import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";

import { verifyAccessToken } from "../clients/auth.client.js";
import { env } from "../config/env.js";
import { PresenceService } from "../services/presence.service.js";
import {
  createPrivateMessage,
  PrivateMessageError,
} from "../services/private-message.service.js";
import type {
  AuthenticatedUser,
  PrivateMessageAck,
  PrivateMessageInput,
} from "../types/chat.types.js";

type AuthenticatedSocket = Socket & {
  data: {
    user: AuthenticatedUser;
  };
};

type AckCallback = (response: PrivateMessageAck) => void;

const accessTokenCookieName = "accessToken";

function extractBearerToken(authorization: string | undefined) {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token.length > 0 ? token : null;
}

function getCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(key.length + 1));
}

function resolveAuthorization(socket: Socket) {
  const authToken =
    typeof socket.handshake.auth.token === "string"
      ? socket.handshake.auth.token.trim()
      : null;
  const headerToken = extractBearerToken(socket.handshake.headers.authorization);
  const cookieToken = getCookieValue(socket.handshake.headers.cookie, accessTokenCookieName);
  const token = authToken || headerToken || cookieToken;

  return token ? `Bearer ${token}` : null;
}

function emitMessageError(socket: Socket, error: unknown, ack?: AckCallback) {
  const payload =
    error instanceof PrivateMessageError
      ? {
          status: "error" as const,
          code: error.code,
          message: error.message,
        }
      : {
          status: "error" as const,
          code: "MESSAGE_FAILED",
          message: "Unable to send private message",
        };

  if (ack) {
    ack(payload);
    return;
  }

  socket.emit("chat:error", payload);
}

export function registerChatGateway(httpServer: HttpServer) {
  const presence = new PresenceService();
  const io = new Server(httpServer, {
    path: env.socketPath,
    serveClient: false,
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const authorization = resolveAuthorization(socket);

    if (!authorization) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const user = await verifyAccessToken(authorization);
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    const { user } = authenticatedSocket.data;
    const connection = presence.connect(user.id, socket.id);

    socket.join(user.id);
    socket.emit("chat:connected", {
      userId: user.id,
      onlineUserIds: presence.getOnlineUserIds(),
    });

    if (connection.isFirstConnection) {
      socket.broadcast.emit("presence:online", { userId: user.id });
    }

    socket.on("presence:list", (ack?: (response: { onlineUserIds: string[] }) => void) => {
      ack?.({ onlineUserIds: presence.getOnlineUserIds() });
    });

    socket.on(
      "private-message",
      (payload: PrivateMessageInput, ack?: AckCallback) => {
        try {
          const message = createPrivateMessage(user.id, payload);
          const delivered = presence.isOnline(message.toUserId);

          if (delivered) {
            io.to(message.toUserId).emit("private-message", message);
          }

          socket.emit("private-message:sent", {
            message,
            delivered,
          });

          ack?.({
            status: "success",
            data: {
              message,
              delivered,
            },
          });
        } catch (error) {
          emitMessageError(socket, error, ack);
        }
      }
    );

    socket.on("disconnect", () => {
      const result = presence.disconnect(socket.id);

      if (result.userId && result.wentOffline) {
        socket.broadcast.emit("presence:offline", { userId: result.userId });
      }
    });
  });

  return {
    io,
    presence,
  };
}

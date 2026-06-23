export type PresenceDisconnectResult = {
  userId: string | null;
  wentOffline: boolean;
};

export class PresenceService {
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly socketUsers = new Map<string, string>();

  connect(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) ?? new Set<string>();

    sockets.add(socketId);
    this.userSockets.set(userId, sockets);
    this.socketUsers.set(socketId, userId);

    return {
      userId,
      socketId,
      isFirstConnection: sockets.size === 1,
    };
  }

  disconnect(socketId: string): PresenceDisconnectResult {
    const userId = this.socketUsers.get(socketId) ?? null;

    if (!userId) {
      return {
        userId: null,
        wentOffline: false,
      };
    }

    this.socketUsers.delete(socketId);

    const sockets = this.userSockets.get(userId);

    if (!sockets) {
      return {
        userId,
        wentOffline: false,
      };
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);

      return {
        userId,
        wentOffline: true,
      };
    }

    return {
      userId,
      wentOffline: false,
    };
  }

  isOnline(userId: string) {
    return this.userSockets.has(userId);
  }

  getOnlineUserIds() {
    return Array.from(this.userSockets.keys());
  }

  getOnlineCount() {
    return this.userSockets.size;
  }
}

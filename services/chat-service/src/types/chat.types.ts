export type AuthenticatedUser = {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

export type PrivateMessageInput = {
  toUserId?: unknown;
  content?: unknown;
  clientMessageId?: unknown;
};

export type PrivateMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  sentAt: string;
  clientMessageId?: string;
};

export type PrivateMessageAck =
  | {
      status: "success";
      data: {
        message: PrivateMessage;
        delivered: boolean;
      };
    }
  | {
      status: "error";
      message: string;
      code: string;
    };

import { InferSchemaType, Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    recipientId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["like"],
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["post", "comment"],
    },
    resourceId: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "notifications",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: unknown;
  createdAt: Date;
};

export const Notification = model<NotificationDocument>(
  "Notification",
  notificationSchema
);

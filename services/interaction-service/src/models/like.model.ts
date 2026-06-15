import { InferSchemaType, Schema, model } from "mongoose";

export const TARGET_TYPES = ["post", "comment", "reply"] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

const likeSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: TARGET_TYPES,
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
    postId: {
      type: String,
      trim: true,
    },
  },
  {
    collection: "likes",
    timestamps: true,
    versionKey: false,
  }
);

likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });
likeSchema.index({ postId: 1 });
likeSchema.index({ userId: 1 });

export type LikeDocument = InferSchemaType<typeof likeSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

export const Like = model<LikeDocument>("Like", likeSchema);

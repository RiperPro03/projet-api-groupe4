import { InferSchemaType, Schema, model } from "mongoose";

const commentLikeSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    commentId: {
      type: String,
      required: true,
      trim: true,
    },
    postId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "comment_likes",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

commentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });
commentLikeSchema.index({ commentId: 1 });
commentLikeSchema.index({ postId: 1 });
commentLikeSchema.index({ userId: 1 });

export type CommentLikeDocument = InferSchemaType<typeof commentLikeSchema> & {
  createdAt: Date;
};

export const CommentLike = model<CommentLikeDocument>(
  "CommentLike",
  commentLikeSchema
);

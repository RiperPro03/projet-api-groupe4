import { InferSchemaType, Schema, model } from "mongoose";

const postLikeSchema = new Schema(
  {
    userId: {
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
    collection: "post_likes",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

postLikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
postLikeSchema.index({ postId: 1 });
postLikeSchema.index({ userId: 1 });

export type PostLikeDocument = InferSchemaType<typeof postLikeSchema> & {
  createdAt: Date;
};

export const PostLike = model<PostLikeDocument>("PostLike", postLikeSchema);

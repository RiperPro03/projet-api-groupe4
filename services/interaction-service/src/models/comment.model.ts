import { InferSchemaType, Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    postId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    authorId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    parentCommentId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 280,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "comments",
    timestamps: true,
    versionKey: false,
  }
);

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ authorId: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export const Comment = model<CommentDocument>("Comment", commentSchema);

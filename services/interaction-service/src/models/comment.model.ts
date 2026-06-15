import { InferSchemaType, Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    postId: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    parentCommentId: {
      type: String,
      default: null,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
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

commentSchema.index({ postId: 1, parentCommentId: 1, createdAt: 1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ userId: 1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const Comment = model<CommentDocument>("Comment", commentSchema);

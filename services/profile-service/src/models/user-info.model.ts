import { InferSchemaType, Schema, model } from "mongoose";
import { z } from "zod";

const requiredString = z.string().trim().min(1);
const createOptionalString = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "");
const updateOptionalString = z
  .string()
  .optional()
  .transform((value) => (value === undefined ? undefined : value.trim()));

const bioInputSchema = z
  .object({
    bio: z.string().optional(),
    bibliography: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.bio !== undefined &&
      value.bibliography !== undefined &&
      value.bio !== value.bibliography
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["bibliography"],
        message: "bio and bibliography must match when both are provided",
      });
    }
  });

export const createProfileSchema = z
  .object({
    id_user: requiredString,
    username: requiredString,
    nickname: createOptionalString,
    url_photo: createOptionalString,
  })
  .and(bioInputSchema)
  .transform((value) => ({
    id_user: value.id_user.trim(),
    username: value.username.trim(),
    nickname: value.nickname,
    bio: (value.bibliography ?? value.bio ?? "").trim(),
    url_photo: value.url_photo,
  }));

export const updateProfileSchema = z
  .object({
    username: requiredString.optional(),
    nickname: updateOptionalString,
    url_photo: updateOptionalString,
  })
  .and(bioInputSchema)
  .transform((value) => ({
    username: value.username?.trim(),
    nickname: value.nickname,
    bio: value.bibliography !== undefined || value.bio !== undefined
      ? (value.bibliography ?? value.bio ?? "").trim()
      : undefined,
    url_photo: value.url_photo,
  }))
  .refine(
    (value) =>
      value.username !== undefined ||
      value.nickname !== undefined ||
      value.bio !== undefined ||
      value.url_photo !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const profileParamsSchema = z.object({
  id_user: requiredString,
});

const userInfoSchema = new Schema(
  {
    id_user: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nickname: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      alias: "bibliography",
    },
    url_photo: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    collection: "user_info",
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  },
);

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserInfo = InferSchemaType<typeof userInfoSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

export const UserInfo = model<UserInfo>("UserInfo", userInfoSchema);

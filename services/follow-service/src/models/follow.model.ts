import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

export interface FollowAttributes {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export type FollowCreationAttributes = Optional<
  FollowAttributes,
  "id" | "created_at"
>;

export class Follow
  extends Model<FollowAttributes, FollowCreationAttributes>
  implements FollowAttributes
{
  declare id: string;
  declare follower_id: string;
  declare following_id: string;
  declare created_at: Date;
}

Follow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    follower_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    following_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "follows",
    timestamps: true,
    updatedAt: false,
    createdAt: "created_at",
    indexes: [
      {
        unique: true,
        fields: ["follower_id", "following_id"],
      },
    ],
  }
);

export default Follow;

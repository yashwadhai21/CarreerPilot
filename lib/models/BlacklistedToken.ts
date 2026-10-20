import { Schema, model, models, Model, Types } from "mongoose"

export interface IBlacklistedToken {
  _id: string
  jti: string
  userId?: Types.ObjectId
  expiresAt: Date
  createdAt: Date
}

const blacklistedTokenSchema = new Schema<IBlacklistedToken>(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

export const BlacklistedToken: Model<IBlacklistedToken> =
  models.BlacklistedToken || model<IBlacklistedToken>("BlacklistedToken", blacklistedTokenSchema)

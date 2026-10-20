import { Schema, model, models, Model, Types } from "mongoose"
import type { Internship } from "@/lib/types"

export interface ILikedInternship {
  _id: string
  userId: Types.ObjectId
  externalId: string
  source?: "static" | "github" | "remoteok" | "remotive" | "jooble"
  snapshot: Internship
  createdAt: Date
}

const likedInternshipSchema = new Schema<ILikedInternship>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    externalId: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["static", "github", "remoteok", "remotive", "jooble"],
      default: "static",
    },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

likedInternshipSchema.index({ userId: 1, externalId: 1 }, { unique: true })

export const LikedInternship: Model<ILikedInternship> =
  models.LikedInternship || model<ILikedInternship>("LikedInternship", likedInternshipSchema)

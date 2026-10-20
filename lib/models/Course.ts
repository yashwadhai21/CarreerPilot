import { Schema, model, models, Model } from "mongoose"
import type { CourseRecommendation } from "@/lib/types"

export interface ICourseDocument extends CourseRecommendation {
  _id: string
  externalId?: string
  createdAt: Date
  updatedAt: Date
}

const courseSchema = new Schema<ICourseDocument>(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    externalId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ["NPTEL", "SWAYAM", "Coursera", "Other"],
      default: "Other",
      index: true,
    },
    duration: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    rating: {
      type: Number,
      default: 0,
    },
    students: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: String,
      default: "Free",
    },
    category: {
      type: String,
      default: "General",
      index: true,
    },
    relevantFor: {
      type: [String],
      default: [],
    },
    certificate: {
      type: String,
      default: "Available",
    },
    link: {
      type: String,
      default: "#",
    },
  },
  {
    timestamps: true,
  }
)

export const CourseModel: Model<ICourseDocument> =
  models.Course || model<ICourseDocument>("Course", courseSchema)

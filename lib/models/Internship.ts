import { Schema, model, models, Model } from "mongoose"
import type { Internship as InternshipType } from "@/lib/types"

export interface IInternshipDocument extends InternshipType {
  _id: string
  externalId: string
  createdAt: Date
  updatedAt: Date
}

const internshipSchema = new Schema<IInternshipDocument>(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    id: {
      type: Number,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    requirements: {
      type: [String],
      default: [],
    },
    salary: {
      type: String,
      default: "Unpaid",
    },
    type: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      default: "Remote",
      index: true,
    },
    logo: {
      type: String,
      default: "/placeholder.svg?height=60&width=60",
    },
    scheme: {
      type: String,
    },
    sector: {
      type: String,
      default: "Technology",
      index: true,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    applyLink: {
      type: String,
    },
    postedDate: {
      type: String,
    },
    openings: {
      type: Number,
    },
    source: {
      type: String,
      default: "static",
    },
  },
  {
    timestamps: true,
  }
)

internshipSchema.index({ title: "text", company: "text", description: "text" })

export const InternshipModel: Model<IInternshipDocument> =
  models.Internship || model<IInternshipDocument>("Internship", internshipSchema)

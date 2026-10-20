import { Schema, model, models, Model, Types } from "mongoose"
import type { AnalysisResult } from "@/lib/types"

export interface IResumeAnalysis {
  _id: string
  userId: Types.ObjectId
  fileName?: string
  fileSize?: number
  mimeType?: string
  analysis: Omit<AnalysisResult, "extractedText">
  skills: string[]
  score: number
  createdAt: Date
  updatedAt: Date
}

const resumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    analysis: {
      type: Schema.Types.Mixed,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export const ResumeAnalysis: Model<IResumeAnalysis> =
  models.ResumeAnalysis || model<IResumeAnalysis>("ResumeAnalysis", resumeAnalysisSchema)

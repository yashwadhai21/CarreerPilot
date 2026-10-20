import { Schema, model, models, Model } from "mongoose"

export interface IUser {
  _id: string
  name: string
  email: string
  passwordHash?: string
  skills: string[]
  interests: string[]
  experience: "Fresher" | "Beginner" | "Intermediate" | "Advanced"
  location: string
  education?: string
  role: "student" | "admin"
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      enum: ["Fresher", "Beginner", "Intermediate", "Advanced"],
      default: "Fresher",
    },
    location: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

export const User: Model<IUser> = models.User || model<IUser>("User", userSchema)

import { z } from "zod"

export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name must be at most 60 characters"),
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain at least one letter and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  interests: z.array(z.string()).optional(),
  experience: z
    .enum(["Fresher", "Beginner", "Intermediate", "Advanced"])
    .optional(),
  location: z.string().optional(),
  education: z.string().optional(),
})

export const likeInternshipSchema = z.object({
  externalId: z.string().min(1, "externalId is required"),
  source: z
    .enum(["static", "github", "remoteok", "remotive", "jooble"])
    .optional(),
  snapshot: z.record(z.any()),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type LikeInternshipInput = z.infer<typeof likeInternshipSchema>

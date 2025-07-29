import { z } from "zod";

export const registerCandidateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, "Invalid international phone number"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().min(1, "Address is required"),
  profile_photo_url: z
    .any()
    .refine((fileList) => fileList && fileList.length === 1, {
      message: "Profile photo is required",
    }),
  applied_role: z.string().min(1, "Role is required"),
  resume: z
    .any()
    .refine((fileList) => fileList && fileList.length === 1, {
      message: "Resume is required",
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/\d/, "At least one number")
    .regex(/[\W_]/, "At least one special character"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
import { z } from "zod";

export const registerCandidateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, "Invalid international phone number"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"]),
  address: z.string().min(1, "Address is required"),
  portfolio_url: z.union([
    z.string().min(1).url("Invalid portfolio URL"), // Valid URLs only
    z.literal(""),    // Empty string from form
    z.null(),         // Null from your controller default
    z.undefined()     // Undefined values
  ])
  .optional()
  .transform((val) => {
    // Transform empty string or null to null (matches your controller)
    if (!val || val === "" || val === null) return null;
    return val;
  }),
  
profile_photo_url: z
  .any()  
  .refine((fileList) => fileList && fileList.length === 1, {
    message: "Profile photo is required",
  }),

  applied_job: z.string().min(1, "Role is required"),
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


export const candidateUpdateSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(50),
  last_name: z.string().trim().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid international phone number")
    .optional(),
  date_of_birth: z
    .string()
    .optional()
    .refine(
      (date) => !date || /^\d{4}-\d{2}-\d{2}$/.test(date),
      { message: "Date of birth must be in YYYY-MM-DD format" }
    ),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(250).optional(),
  profile_photo_url: z.object({ url: z.url("Invalid profile photo URL"), publicId: z.string() }).optional(),
  portfolio_url: z.url("Invalid portfolio URL").optional().or(z.literal("")),
}).strict();

export const hrQuestionnaireResponseSchema = z.object({
  responses: z.array(
    z.object({
      question: z.string().length(24, "Invalid question ObjectId"),
      answer: z.union([
        z.string().trim().min(1, "Text answer is required"),           // for text
        z.string().url("Invalid audio file URL"),                     // for audio  
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format") // for date (YYYY-MM-DD)
      ]),
      attachment: z.string().url("Invalid attachment URL").optional() // Add attachment support
    })
  ).min(1, "At least one answer is required")
});
 

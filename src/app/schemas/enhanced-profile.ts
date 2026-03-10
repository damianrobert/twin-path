import { z } from "zod";

// Base profile fields
const baseProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  role: z.enum(["mentor", "mentee", "both"]),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  availability: z.string().max(200, "Availability must be less than 200 characters").optional(),
});

// Mentor-specific fields
const mentorFieldsSchema = z.object({
  professionalExperience: z.string().min(10, "Please provide at least 10 characters about your experience").max(1000, "Experience must be less than 1000 characters").optional(),
  portfolioUrl: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  githubUrl: z.string().url("Please enter a valid GitHub URL").or(z.literal("")).optional(),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").or(z.literal("")).optional(),
  yearsOfExperience: z.number().min(0, "Years of experience must be at least 0").max(50, "Years of experience must be less than 50").optional(),
  teachingExperience: z.string().max(500, "Teaching experience must be less than 500 characters").optional(),
});

// Enhanced profile schema that includes mentor fields when role is mentor or both
export const enhancedProfileSchema = baseProfileSchema
  .extend({
    professionalExperience: z.string().max(1000, "Experience must be less than 1000 characters").optional(),
    portfolioUrl: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
    githubUrl: z.string().url("Please enter a valid GitHub URL").or(z.literal("")).optional(),
    linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").or(z.literal("")).optional(),
    yearsOfExperience: z.number().min(0, "Years of experience must be at least 0").max(50).optional(),
    teachingExperience: z.string().max(500, "Teaching experience must be less than 500 characters").optional(),
  })
  .refine(
    (data) => {
      // If user is mentor or both, require at least some mentor-specific fields
      if (data.role === "mentor" || data.role === "both") {
        return !!(data.professionalExperience || data.portfolioUrl || data.githubUrl);
      }
      return true;
    },
    {
      message: "As a mentor, please provide at least one of: professional experience, portfolio URL, or GitHub URL",
      path: ["professionalExperience"],
    }
  );

export type EnhancedProfileValues = z.infer<typeof enhancedProfileSchema>;

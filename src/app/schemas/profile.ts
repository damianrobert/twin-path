import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  role: z.enum(["mentor", "mentee", "both"]),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  availability: z.string().max(200, "Availability must be less than 200 characters").optional(),
});

export type ProfileValues = z.infer<typeof profileSchema>;

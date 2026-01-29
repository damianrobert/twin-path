import z from "zod";

export const blogSchema = z.object({
  title: z.string().min(3).max(50),
  content: z.string().min(10),
});

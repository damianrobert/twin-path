import z from "zod";
import { commonSchemas } from "@/lib/validation";

export const signUpSchema = z.object({
  name: commonSchemas.name,
  email: commonSchemas.email,
  password: commonSchemas.password,
});

export const loginSchema = z.object({
  email: commonSchemas.email,
  password: z.string().min(1, "Password is required"),
});

export const passwordResetSchema = z.object({
  email: commonSchemas.email,
});

export const newPasswordSchema = z.object({
  token: z.string().min(1, "Invalid reset token"),
  password: commonSchemas.password,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

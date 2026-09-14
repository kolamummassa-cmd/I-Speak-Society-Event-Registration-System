import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.literal("ORGANIZER"),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

import z from "zod/v4";

export const apiUserSignup = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const apiUserLogin = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const apiUserUpdate = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.email("Invalid email address").optional(),
  image: z.string().optional(),
});

export type UserSignup = z.infer<typeof apiUserSignup>;
export type UserLogin = z.infer<typeof apiUserLogin>;
export type LoginForm = z.infer<typeof apiUserLogin>;
export type UserUpdate = z.infer<typeof apiUserUpdate>;

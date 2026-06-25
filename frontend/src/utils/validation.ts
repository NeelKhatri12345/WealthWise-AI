import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters");

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

export const amountSchema = z
  .number()
  .positive("Amount must be positive")
  .finite("Amount must be a finite number");

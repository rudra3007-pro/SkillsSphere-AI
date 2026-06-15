import { z } from 'zod';

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9\s]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(2, 'Name must be at least 2 characters'),
  email: z.string({ required_error: "Email is required" }).trim().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
  role: z.enum(['student', 'recruiter', 'tutor', 'admin']).optional(),
  company: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).trim().email('Invalid email address').toLowerCase(),
  password: z.string({ required_error: "Password is required" }).min(1, 'Password is required'),
});

const otpSchema = z
  .string({ required_error: "OTP is required" })
  .regex(/^\d{6}$/, "OTP must be exactly 6 numeric digits");

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: otpSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: otpSchema,
  newPassword: passwordSchema,
});

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['verify', 'reset']),
});

export const googleAuthSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const githubAuthSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

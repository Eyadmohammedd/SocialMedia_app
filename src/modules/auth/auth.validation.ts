import { z } from "zod";

export const signupValidation = {
  body: z.object({
    username: z.string().min(3).max(20),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
    gender: z.string(),
    role: z.string(),
    provider: z.string(),
    DOB: z.string().optional(),
  }),
};

/* ================= CONFIRM EMAIL ================= */

export const confirmEmailValidation = {
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
  }),
};

/* ================= RESEND ================= */

export const reSendConfirmEmailValidation = {
  body: z.object({
    email: z.string().email(),
  }),
};

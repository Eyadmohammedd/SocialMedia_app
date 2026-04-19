import { z } from "zod";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/Enums";

/* ================= DTOs ================= */

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto extends LoginDto {
  username?: string;

  firstName: string;
  lastName: string;

  phone?: string;

  gender?: GenderEnum;
  role?: RoleEnum;
  provider?: ProviderEnum;

  googleId?: string;

  DOB?: Date;

  // system fields (optional - usually backend controlled)
  isConfirmed?: boolean;
  ConfirmEmail?: Date;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

/* ================= VALIDATION ================= */

export const loginValidation = {
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
};

export const signupValidation = {
  body: z.object({
    username: z.string().min(3).max(30).optional(),

    firstName: z.string().min(2, "First name too short").max(50),
    lastName: z.string().min(2, "Last name too short").max(50),

    email: z.string().email("Invalid email format"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),

    phone: z.string().optional(),

    gender: z.nativeEnum(GenderEnum).optional(),
    role: z.nativeEnum(RoleEnum).optional(),
    provider: z.nativeEnum(ProviderEnum).optional(),

    googleId: z.string().optional(),

    DOB: z.coerce.date().optional(),
  }),
};

export const confirmEmailValidation = {
  body: z.object({
    email: z.string().email("Invalid email format"),
    code: z.string().length(6, "OTP must be 6 digits"),
  }),
};

export const reSendConfirmEmailValidation = {
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
};

export const refreshTokenValidation = {
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

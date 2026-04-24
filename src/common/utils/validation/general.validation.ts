import { Types } from "mongoose";
import { z } from "zod";

export const generalValidation = {
  email: z.email(),
  password: z
    .string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\w).{8,16}$/, {
      error: "weak password",
    }),
  username: z
    .string({ error: "username is mandatory" })
    .min(2, { error: "min is 2 char" })
    .max(25, { error: "max is 25" }),
  firstName: z
    .string()
    .min(2, { message: "firstName must be at least 2 characters" })
    .max(50),
  lastName: z
    .string()
    .min(2, { message: "lastName must be at least 2 characters" })
    .max(50),
  confirmPassword: z.string(),
  phone: z
    .string({ error: "phone is required" })
    .regex(/^(00201|\+201|01)((0|1|2|5)|\d{8})$/, {
      error: "invalid phone number",
    }),
  otp: z.string().regex(/^\d{6}$/),
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId format",
  }),
};

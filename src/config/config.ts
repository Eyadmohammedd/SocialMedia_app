import { config } from "dotenv";
import { resolve } from "path";

config({
  path: resolve(
    `./.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`,
  ),
});

export const PORT = process.env.PORT || 3000;

export const port = process.env.port ?? 7000;

export const DB_URI = process.env.DB_URI as string;
export const ENC_BYTE = process.env.ENC_BYTE as string;
export const User_TOKEN_SECRET_KEY = process.env
  .User_TOKEN_SECRET_KEY as string;
export const System_TOKEN_SECRET_KEY = process.env
  .System_TOKEN_SECRET_KEY as string;
export const User_REFRESH_TOKEN_SECRET_KEY = process.env
  .User_REFRESH_TOKEN_SECRET_KEY as string;
export const System_REFRESH_TOKEN_SECRET_KEY = process.env
  .System_REFRESH_TOKEN_SECRET_KEY as string;
export const REFRESH_EXPIRES_IN = parseInt(
  process.env.REFRESH_EXPIRES_IN ?? "1800",
);
export const ACCESS_EXPIRES_IN = parseInt(
  process.env.ACCESS_EXPIRES_IN ?? "1800",
);
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL as string;

export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
export const CLIENT_IDS = process.env.CLIENT_IDS?.split(",") || [];

export const REDIS_URI = process.env.REDIS_URI as string;

export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD as string;
export const EMAIL_APP = process.env.EMAIL_APP as string;

export const APPLICATION_NAME = process.env.APPLICATION_NAME as string;

export const TWITTER_LINK = process.env.TWITTER_LINK as string;
export const FACEBOOK_LINK = process.env.FACEBOOK_LINK as string;
export const INSTAGRAM_LINK = process.env.INSTAGRAM_LINK as string;
export const ORIGINS = (process.env.ORIGINS?.split(",") || []) as string[];

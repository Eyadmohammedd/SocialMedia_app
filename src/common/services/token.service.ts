import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  User_TOKEN_SECRET_KEY,
  User_REFRESH_TOKEN_SECRET_KEY,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
} from "../../config/config";
import { redisService, RedisService } from "./redis.service";
import { UnauthorizedException } from "../exceptions";

/* ================= TYPES ================= */

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/* ================= SERVICE ================= */

export class TokenService {
  private readonly redis: RedisService;

  constructor() {
    this.redis = redisService;
  }

  /* ================= GENERATE ================= */

  generateTokens(payload: Omit<TokenPayload, "jti">): TokenPair {
    const jti = uuidv4();

    const fullPayload: TokenPayload = {
      ...payload,
      jti,
    };

    const accessToken = jwt.sign(fullPayload, User_TOKEN_SECRET_KEY, {
      expiresIn: ACCESS_EXPIRES_IN,
    } as SignOptions);

    const refreshToken = jwt.sign(fullPayload, User_REFRESH_TOKEN_SECRET_KEY, {
      expiresIn: REFRESH_EXPIRES_IN,
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  /* ================= STORE REFRESH ================= */

  async storeRefreshToken(userId: string, refreshToken: string) {
    const key = this.redis.refreshTokenKey({ userId });

    await this.redis.set({
      key,
      value: refreshToken,
      ttl: REFRESH_EXPIRES_IN,
    });
  }

  /* ================= VERIFY ================= */

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, User_TOKEN_SECRET_KEY) as TokenPayload;
    } catch (err: any) {
      throw new UnauthorizedException(
        err.name === "TokenExpiredError"
          ? "Access token expired"
          : "Invalid access token",
      );
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, User_REFRESH_TOKEN_SECRET_KEY) as TokenPayload;
    } catch (err: any) {
      throw new UnauthorizedException(
        err.name === "TokenExpiredError"
          ? "Refresh token expired"
          : "Invalid refresh token",
      );
    }
  }

  /* ================= VALIDATE ================= */

  async validateStoredRefreshToken(userId: string, incomingToken: string) {
    const key = this.redis.refreshTokenKey({ userId });

    const stored = await this.redis.get<string>(key);

    if (!stored || stored !== incomingToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return true;
  }

  /* ================= ROTATE ================= */

  async rotateRefreshToken(payload: TokenPayload): Promise<TokenPair> {
    const tokens = this.generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    await this.storeRefreshToken(payload.sub, tokens.refreshToken);

    return tokens;
  }

  /* ================= LOGOUT ================= */

  async revokeRefreshToken(userId: string) {
    const key = this.redis.refreshTokenKey({ userId });
    await this.redis.deleteKey(key);
  }

  /* ================= BLACKLIST ================= */

  async revokeAccessToken(userId: string, jti: string, ttl: number) {
    const key = this.redis.revokeTokenKey({ userId, jti });

    await this.redis.set({
      key,
      value: 1,
      ttl,
    });
  }

  async isAccessTokenRevoked(userId: string, jti: string): Promise<boolean> {
    const key = this.redis.revokeTokenKey({ userId, jti });

    const val = await this.redis.get(key);

    return val !== null;
  }
}

/* ================= INSTANCE ================= */

export const tokenService = new TokenService();

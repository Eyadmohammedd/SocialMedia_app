import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  User_TOKEN_SECRET_KEY,
  User_REFRESH_TOKEN_SECRET_KEY,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
} from "../../config/config";
import { redisService, RedisService } from "./redis.service";
import { UnauthorizedException, BadRequestException } from "../exceptions";
import { TokenTypeEnum } from "../Enums/security.enums";

/* ================= TYPES ================= */

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  type: TokenTypeEnum;
  iat?: number;
  exp?: number;
}
/* ================= TokenPair ================= */
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

  generateTokens(payload: Omit<TokenPayload, "jti" | "type">) {
    const jti = uuidv4();

    const accessToken = jwt.sign(
      { ...payload, jti, type: TokenTypeEnum.ACCESS },
      User_TOKEN_SECRET_KEY,
      { expiresIn: ACCESS_EXPIRES_IN } as SignOptions,
    );

    const refreshToken = jwt.sign(
      { ...payload, jti, type: TokenTypeEnum.REFRESH },
      User_REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: REFRESH_EXPIRES_IN } as SignOptions,
    );

    return { accessToken, refreshToken };
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

  /* ================= DECODE (FIXED 🔥) ================= */

  async decodeToken({
    token,
    tokenType = TokenTypeEnum.ACCESS,
  }: {
    token: string;
    tokenType?: TokenTypeEnum;
  }): Promise<TokenPayload> {
    const decoded = jwt.decode(token) as TokenPayload;

    if (!decoded) {
      throw new BadRequestException("Invalid token format");
    }

    // check revoked
    if (decoded.jti) {
      const isRevoked = await this.isAccessTokenRevoked(
        decoded.sub,
        decoded.jti,
      );

      if (isRevoked) {
        throw new UnauthorizedException("Invalid login session");
      }
    }

    // verify
    const verified =
      tokenType === TokenTypeEnum.REFRESH
        ? this.verifyRefreshToken(token)
        : this.verifyAccessToken(token);

    // check type
    if (verified.type !== tokenType) {
      throw new UnauthorizedException("Invalid token type");
    }

    return verified;
  }

  /* ================= REFRESH ================= */

  async storeRefreshToken(userId: string, refreshToken: string) {
    const key = this.redis.refreshTokenKey({ userId });

    await this.redis.set({
      key,
      value: refreshToken,
      ttl: REFRESH_EXPIRES_IN,
    });
  }

  async validateStoredRefreshToken(userId: string, incomingToken: string) {
    const key = this.redis.refreshTokenKey({ userId });

    const stored = await this.redis.get<string>(key);

    if (!stored || stored !== incomingToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async rotateRefreshToken(payload: TokenPayload) {
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

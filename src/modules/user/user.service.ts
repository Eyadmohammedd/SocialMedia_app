import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces/user.interface";
import {
  redisService,
  RedisService,
  TokenService,
} from "../../common/services";
import { ConflictException } from "../../common/exceptions";
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from "../../config/config";
import { logoutEnum } from "../../common/Enums";

export class UserService {
  private readonly redis: RedisService;
  private readonly tokens: TokenService;

  constructor() {
    this.redis = redisService;
    this.tokens = new TokenService();
  }

  // ================= PROFILE =================
  async profile(user: HydratedDocument<IUser>) {
    return user.toJSON();
  }

  // ================= LOGOUT =================
  async logout(
    { flag }: { flag: logoutEnum },
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
  ): Promise<number> {
    let status = 200;

    switch (flag) {
      case logoutEnum.ALL:
        user.credentialsChangedAt = new Date();
        await user.save();

        const keys = await this.redis.keys(
          this.redis.baseRevokeTokenKey(sub),
        );

        if (keys.length) {
          for (const key of keys) {
            await this.redis.deleteKey(key);
          }
        }

        break;

      default:
        await this.tokens.revokeAccessToken(
          sub,
          jti,
          REFRESH_EXPIRES_IN,
        );

        status = 201;
        break;
    }

    return status;
  }

  // ================= ROTATE TOKEN =================
  async rotateToken(
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
    issuer: string,
  ) {
    if ((iat + ACCESS_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
      throw new ConflictException("Current access token still valid");
    }

    await this.tokens.revokeAccessToken(
      sub,
      jti,
      REFRESH_EXPIRES_IN,
    );

    return this.tokens.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  }
}

export default new UserService();
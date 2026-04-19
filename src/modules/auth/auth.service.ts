import { LoginDto, SignupDto } from "./auth.dto";
import { DeleteResult } from "mongoose";
import { IUser } from "../../common/interfaces/user.interface";
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "../../common/exceptions";
import {
  generateHash,
  compareHash,
} from "../../common/utils/security/hash.security";
import { generateEncryption } from "../../common/utils/security/encryption.security";
import { UserRepository } from "../../DB/repository";
import { redisService, RedisService } from "../../common/services/redis.service";
import { tokenService, TokenService, TokenPair } from "../../common/services/token.service";
import { EmailEnum } from "../../common/Enums";

/* ================= TYPES ================= */

export interface AuthTokenResponse extends TokenPair {
  user: Partial<IUser>;
}

/* ================= SERVICE ================= */

export class AuthenticationService {
  private readonly userRepository: UserRepository;
  private readonly redis: RedisService;
  private readonly tokens: TokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisService;
    this.tokens = tokenService;
  }

  /* ================= LOGIN ================= */

  public async login(data: LoginDto): Promise<AuthTokenResponse> {
    const { email, password } = data;

    // 1. Find user with password selected
    const user = await this.userRepository.findOne({
      filter: { email },
      projection: { password: 1, email: 1, role: 1, isConfirmed: 1, provider: 1 },
      options: { lean: false },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // 2. Google-only users have no password
    if (!user.password) {
      throw new UnauthorizedException(
        "This account uses Google login. Please sign in with Google."
      );
    }

    // 3. Verify password
    const isMatch = await compareHash({
      plaintext: password,
      hash: user.password,
    });

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // 4. Must confirm email first
    if (!user.isConfirmed) {
      throw new UnauthorizedException(
        "Please confirm your email before logging in"
      );
    }

    // 5. Generate tokens
    const tokenPair = this.tokens.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // 6. Store refresh token in Redis (rotation — one active per user)
    await this.tokens.storeRefreshToken(user._id.toString(), tokenPair.refreshToken);

    return {
      ...tokenPair,
      user: this.sanitizeUser(user),
    };
  }

  /* ================= SIGNUP ================= */

  public async signup(data: SignupDto): Promise<IUser> {
    const exists = await this.findUserByEmail(data.email);

    if (exists) {
      throw new ConflictException("User already exists");
    }

    const user = await this.createUser(data);

    if (!user) {
      throw new BadRequestException("User creation failed");
    }

    // Send OTP (now stored as real bcrypt hash in Redis)
    await this.redis.sendEmailOtp({
      email: data.email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "Verify Email",
    });

    return user;
  }

  /* ================= CONFIRM EMAIL ================= */

  public async confirmEmail(data: { email: string; code: string }) {
    const { email, code } = data;

    const key = this.redis.otpKey({
      email,
      type: EmailEnum.CONFIRM_EMAIL,
    });

    // 1. Get stored hash from Redis
    const storedOtp = await this.redis.get<string>(key);

    if (!storedOtp) {
      throw new BadRequestException("OTP expired or not found");
    }

    // 2. ✅ FIXED: compare with real bcrypt
    const isMatch = await compareHash({
      plaintext: code,
      hash: storedOtp,
    });

    if (!isMatch) {
      throw new BadRequestException("Invalid OTP");
    }

    // 3. Cleanup Redis keys
    await this.redis.deleteKey(key);
    await this.redis.deleteKey(
      this.redis.otpMaxRequestKey({ email, type: EmailEnum.CONFIRM_EMAIL })
    );

    // 4. Mark user as confirmed
    await this.userRepository.updateOne({
      filter: { email },
      update: { isConfirmed: true, ConfirmEmail: new Date() },
    });

    return { message: "Email confirmed successfully" };
  }

  /* ================= RESEND OTP ================= */

  public async reSendConfirmEmail(data: { email: string }) {
    const { email } = data;

    const user = await this.findUserByEmail(email);
    if (!user) throw new BadRequestException("User not found");

    await this.redis.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "Verify Email",
    });

    return { message: "OTP resent successfully" };
  }

  /* ================= LOGOUT ================= */

  public async logout(userId: string, accessToken: string): Promise<{ message: string }> {
    // 1. Revoke refresh token (Redis delete)
    await this.tokens.revokeRefreshToken(userId);

    // 2. Blacklist the current access token by its jti
    try {
      const payload = this.tokens.verifyAccessToken(accessToken);
      const now = Math.floor(Date.now() / 1000);
      const remainingTTL = (payload.exp ?? now) - now;

      if (remainingTTL > 0) {
        await this.tokens.revokeAccessToken(userId, payload.jti, remainingTTL);
      }
    } catch {
      // token already expired — nothing to blacklist
    }

    return { message: "Logged out successfully" };
  }

  /* ================= REFRESH TOKENS ================= */

  public async refreshTokens(incomingRefreshToken: string): Promise<TokenPair> {
    // 1. Verify the refresh token signature
    const payload = this.tokens.verifyRefreshToken(incomingRefreshToken);

    // 2. Check it matches what we stored (rotation guard)
    const isValid = await this.tokens.validateStoredRefreshToken(
      payload.sub,
      incomingRefreshToken
    );

    if (!isValid) {
      // Possible token reuse — revoke everything
      await this.tokens.revokeRefreshToken(payload.sub);
      throw new UnauthorizedException(
        "Refresh token reuse detected. Please log in again."
      );
    }

    // 3. Issue new pair + rotate
    const newPair = this.tokens.generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    await this.tokens.storeRefreshToken(payload.sub, newPair.refreshToken);

    return newPair;
  }

  /* ================= GOOGLE OAUTH ================= */

  public async googleAuth(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }): Promise<AuthTokenResponse> {
    // 1. Find existing user
    let user = await this.userRepository.findOne({
      filter: { email: googleUser.email },
      options: { lean: false },
    });

    if (!user) {
      // 2a. New user — create with Google provider
      user = await this.userRepository.createOne({
        data: {
          ...googleUser,
          provider: "google",
          isConfirmed: true,          // email is verified by Google
          ConfirmEmail: new Date(),
          role: "user",
        },
      });
    } else if (!user.googleId) {
      // 2b. Existing system user — link Google account
      await this.userRepository.updateOne({
        filter: { email: googleUser.email },
        update: { googleId: googleUser.googleId, isConfirmed: true },
      });
    }

    // 3. Generate tokens
    const tokenPair = this.tokens.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.tokens.storeRefreshToken(user._id.toString(), tokenPair.refreshToken);

    return { ...tokenPair, user: this.sanitizeUser(user) };
  }

  /* ================= HELPERS ================= */

  public async findUserByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findOne({
      filter: { email },
      projection: { email: 1 },
      options: { lean: true },
    });
  }

  public async createUser(data: SignupDto): Promise<IUser> {
    const securedData = await this.secureUserData(data);

    const user = await this.userRepository.createOne({ data: securedData });

    if (!user) throw new BadRequestException("User creation failed");

    return this.normalizeUser(user);
  }

  private async secureUserData(data: SignupDto) {
    return {
      ...data,
      phone: data.phone ? await generateEncryption(data.phone) : undefined,
      password: await generateHash({ plaintext: data.password }),
    };
  }

  /** Strip sensitive fields before sending to client */
  private sanitizeUser(user: any): Partial<IUser> {
    const obj = user?.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
  }

  public async deleteUsers(
    filter: Partial<IUser> | Record<string, unknown>,
    options?: any
  ): Promise<DeleteResult> {
    return this.userRepository.deleteMany({ filter, options });
  }

  private normalizeUser(user: any): IUser {
    return user?.toJSON?.() ?? (user as IUser);
  }
}

export default new AuthenticationService();
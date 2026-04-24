import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { successResponse } from "../../common/response";
import authService from "./auth.service";
import { ILoginResponse } from "./auth.entity";
import {
  signupValidation,
  confirmEmailValidation,
  reSendConfirmEmailValidation,
} from "./auth.validation";
import { BadRequestException } from "../../common/exceptions";
import { authentication } from "../../middleware";

/* ================= VALIDATION ================= */

const validationMiddleware =
  (schema: any) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.body.parse(req.body);
      req.body = parsed;
      next();
    } catch (error: any) {
      next(
        new BadRequestException(
          `Validation failed: ${error.errors?.[0]?.message || "Invalid input"}`,
        ),
      );
    }
  };

const router = Router();

/* ================= LOGIN ================= */

router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await authService.login(req.body);

      successResponse<ILoginResponse>({
        res,
        message: "Login successful",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* ================= SIGNUP ================= */

router.post(
  "/signup",
  validationMiddleware(signupValidation),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.signup(req.body);

      successResponse({
        res,
        status: 201,
        message: "Signup successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* ================= CONFIRM EMAIL ================= */

router.patch(
  "/confirm-email",
  validationMiddleware(confirmEmailValidation),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await authService.confirmEmail(req.body);

      successResponse({
        res,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* ================= RESEND OTP ================= */

router.patch(
  "/resend-confirm-email",
  validationMiddleware(reSendConfirmEmailValidation),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await authService.reSendConfirmEmail(req.body);

      successResponse({
        res,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* ================= LOGOUT ================= */

router.post(
  "/logout",
  authentication(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const accessToken = req.headers.authorization?.split(" ")[1] || "";

      const result = await authService.logout(user.sub, accessToken);

      successResponse({
        res,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { successResponse } from "../../common/response";
import userService from "./user.service";
import { authentication } from "../../middleware";
import { TokenTypeEnum } from "../../common/Enums";
import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
const router = Router();

//  profile
router.get(
  "/profile",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const data = await userService.profile(req.user as HydratedDocument<IUser>);

    return successResponse({ res, data });
  },
);

// logout
router.post(
  "/logout",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const status = await userService.logout(
      req.body,
      req.user as HydratedDocument<IUser>,
      req.decoded as { jti: string; iat: number; sub: string },
    );

    return successResponse({ res, status });
  },
);

// rotate-token
router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESH),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const credential = await userService.rotateToken(
      req.user as HydratedDocument<IUser>,
      req.decoded as { jti: string; iat: number; sub: string },
      `${req.protocol}://${req.host}`,
    );

    return successResponse({ res, status: 201, data: credential });
  },
);
export default router;

import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../common/exceptions";
import { TokenService } from "../common/services";
import { TokenTypeEnum } from "../common/Enums/security.enums";
import { UserModel } from "../DB/model/user.model";
import { HydratedDocument } from "mongoose";
import { IUser } from "../common/interfaces";

export const authentication = (
  tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenService = new TokenService();

      const [key, credential] = req.headers?.authorization?.split(" ") || [];

      if (!key || !credential) {
        throw new UnauthorizedException("Missing authorization");
      }

      const decoded = await tokenService.decodeToken({
        token: credential,
        tokenType,
      });

      const user = await UserModel.findById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

(req as any).user = user as HydratedDocument<IUser>;
      (req as any).decoded = decoded;

      next();
    } catch (error) {
      next(error);
    }
  };
};

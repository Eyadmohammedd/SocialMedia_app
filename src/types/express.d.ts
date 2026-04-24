import { HydratedDocument } from "mongoose";
import { IUser } from "../common/interfaces/user.interface";

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
      decoded?: {
        jti: string;
        iat: number;
        sub: string;
      };
    }
  }
}

export {}; // 

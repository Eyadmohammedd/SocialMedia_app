import { Types, Document } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../Enums";

export interface IUser extends Document {
  _id: Types.ObjectId;

  firstName: string;
  lastName: string;
  username?: string;

  email: string;
  password?: string;
  slug: string;
  phone?: string;
  profilePicture?: string;
  coverPicture?: string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  googleId?: string;

  isConfirmed?: boolean;
  confirmEmailAt?: Date;
  deletedAt?: Date | null;

  credentialsChangedAt?: Date;
  DOB?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

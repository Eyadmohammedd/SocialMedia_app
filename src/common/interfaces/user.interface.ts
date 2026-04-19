import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../Enums";

export interface IUser {
  _id: Types.ObjectId; // 🔥 مهم جدًا

  firstName: string;
  lastName: string;
  username?: string;

  email: string;
  password?: string; // خليها optional عشان google

  phone?: string;
  profilePicture?: string;
  coverPicture?: string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  googleId?: string; 

  isConfirmed?: boolean; 
  ConfirmEmail?: Date;

  ChangeCredentialstime?: Date;
  DOB?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

import mongoose, { Schema } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/Enums";
import { IUser } from "../../common/interfaces/user.interface";

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (this) {
        return this.provider == ProviderEnum.SYSTEM;
      },
    },

    phone: { type: String },
    profilePicture: { type: String },
    coverPicture: { type: String },

    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.MALE,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.USER,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.GOOGLE,
    },

    ChangeCredentialstime: { type: Date },
    DOB: { type: Date },
    ConfirmEmail: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_USERS",
  },
);

userSchema
  .virtual("username")
  .get(function (this: IUser) {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (this: IUser, value: string) {
    const parts = value.trim().split(" ");

    if (parts.length >= 2) {
      this.firstName = parts[0]!;
      this.lastName = parts.slice(1).join(" ");
    }
  });

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

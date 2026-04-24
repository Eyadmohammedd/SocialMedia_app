import mongoose, { HydratedDocument, Schema } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/Enums";
import { IUser } from "../../common/interfaces/user.interface";
import { BadRequestException } from "../../common/exceptions";
import { generateEncryption } from "../../common/utils/security/encryption.security";
import { generateHash } from "../../common/utils/security";
export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    slug: { type: String },
    email: { type: String },
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

    credentialsChangedAt: { type: Date },
    DOB: { type: Date },
    confirmEmailAt: { type: Date },
    deletedAt: { type: Date, default: null },
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
      this.slug = value.replaceAll(/\s+/g, "-");
    }
  });

//  save
userSchema.pre("save", async function (this: UserDocument) {
  // Hash password
  if (this.isModified("password") && this.password) {
    this.password = await generateHash({ plaintext: this.password });
  }

  if (this.phone && this.isModified("phone")) {
    this.phone = await generateEncryption(this.phone);
  }

  if (this.isModified("firstName") || this.isModified("lastName")) {
    const fullName = `${this.firstName} ${this.lastName}`;
    this.slug = fullName.replaceAll(/\s+/g, "-").toLowerCase();
  }
});

//  updateOne
userSchema.pre(
  "updateOne",
  { document: true, query: false },
  async function (this: UserDocument) {
    const update = this.updateOne() as Record<string, any>;
    const set = update?.$set ?? {};

    if (set.password) {
      set.password = await generateHash({ plaintext: set.password });
    }

    if (set.phone) {
      set.phone = await generateEncryption(set.phone);
    }

    const firstName = set.firstName ?? this.firstName;
    const lastName = set.lastName ?? this.lastName;
    if (set.firstName || set.lastName) {
      set.slug = `${firstName} ${lastName}`
        .replaceAll(/\s+/g, "-")
        .toLowerCase();
    }
  },
);

//  deleteOne
userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (this: UserDocument) {
    // Name-conflict guard example — you can adapt the condition to your needs
    const conflict = await this.model("User").findOne({
      slug: this.slug,
      _id: { $ne: this._id },
      deletedAt: null,
    });

    if (conflict) {
      throw new Error(
        `Name conflict: another user with slug "${this.slug}" already exists.`,
      );
    }

    this.deletedAt = new Date();
    await this.save();
  },
);

userSchema.pre(
  ["find", "findOne", "findOneAndUpdate", "findOneAndDelete"],
  function (this: any) {
    if (this.getOptions().withDeleted) return;

    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  },
);

userSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate"],
  { document: false, query: true },
  async function (this: any) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }

    const update = this.getUpdate() as Record<string, any>;
    const set = update?.$set ?? {};

    if (set.password) {
      set.password = await generateHash({ plaintext: set.password });
      update.$set = set;
    }

    if (set.phone) {
      set.phone = await generateEncryption(set.phone);
      update.$set = set;
    }

    if (set.firstName || set.lastName) {
      const currentDoc = await this.model.findOne(filter).lean();
      const firstName = set.firstName ?? currentDoc?.firstName ?? "";
      const lastName = set.lastName ?? currentDoc?.lastName ?? "";
      set.slug = `${firstName} ${lastName}`
        .replaceAll(/\s+/g, "-")
        .toLowerCase();
      update.$set = set;
    }
  },
);

const DELETE_OPS = ["deleteOne", "deleteMany"] as const;

DELETE_OPS.forEach((op) => {
  userSchema.pre(
    op,
    { document: false, query: true },
    async function (this: any) {
      const filter = this.getFilter();

      // Only operate on non-deleted documents
      const softFilter = { ...filter, deletedAt: null };

      if (op === "deleteOne") {
        await this.model.updateOne(softFilter, {
          $set: { deletedAt: new Date() },
        });
      } else {
        await this.model.updateMany(softFilter, {
          $set: { deletedAt: new Date() },
        });
      }
      this.setQuery({ _id: null });
    },
  );
});

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

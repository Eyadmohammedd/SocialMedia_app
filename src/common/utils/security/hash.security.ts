import { SALT_ROUND } from "../../../config/config";
import { compare, hash } from "bcrypt";

export const generateHash = async ({
  plaintext,
  salt = SALT_ROUND,
}: {
  plaintext: string;
  salt?: number;
}): Promise<string> => {
  return await hash(plaintext, salt);
};

export const compareHash = async ({
  plaintext,
  hash,
}: {
  plaintext: string;
  hash: string;
}): Promise<boolean> => {
  return await compare(plaintext, hash);
};

import bcrypt from "bcryptjs";

const DEFAULT_BCRYPT_ROUNDS = 12;
const parsed = Number(process.env.BCRYPT_ROUNDS);
const BCRYPT_ROUNDS =
  Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_BCRYPT_ROUNDS;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

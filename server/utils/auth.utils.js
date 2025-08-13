import bcrypt from "bcryptjs";

// Number of rounds for `bcrypt` hashing.
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 12) || 12;

// Function to hash a password using `bcrypt`.
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Function to compare a password with a hashed password.
async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export { hashPassword, comparePassword };

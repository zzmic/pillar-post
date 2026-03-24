import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import { hashPassword, comparePassword } from "./auth.utils.js";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe("auth.utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2a$12$hashedPasswordString";

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, expect.any(Number));
    });

    it("should use default BCRYPT_ROUNDS when env variable is not set", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2a$12$hashedPasswordString";

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, expect.any(Number));
    });

    it("should handle empty password", async () => {
      const password = "";
      const hashedPassword = "$2a$12$hashedEmptyPassword";

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalled();
    });
  });

  describe("comparePassword", () => {
    it("should return true when password matches", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2a$12$hashedPasswordString";

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await comparePassword(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it("should return false when password does not match", async () => {
      const password = "wrongPassword";
      const hashedPassword = "$2a$12$hashedPasswordString";

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await comparePassword(password, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it("should handle empty password comparison", async () => {
      const password = "";
      const hashedPassword = "$2a$12$hashedPasswordString";

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await comparePassword(password, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });
});

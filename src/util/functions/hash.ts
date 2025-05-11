import { createHash } from "crypto";

export function hashWithoutSalt(input: string): string {
  // Create a SHA256 hash using Node.js crypto module
  return createHash("sha256").update(input).digest("hex");
}

// Example usage
const inputString = "Rahul";
const hashedString = hashWithoutSalt(inputString);

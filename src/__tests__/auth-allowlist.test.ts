import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test the allowlist logic directly (extracted from src/lib/auth.ts)
function parseAllowlist(envValue: string | undefined): string[] {
  return (envValue ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailAllowed(
  allowedEmails: string[],
  profileEmail: string | undefined | null
): boolean {
  if (allowedEmails.length === 0) return true;
  const email = profileEmail?.toLowerCase();
  return !!email && allowedEmails.includes(email);
}

describe("allowlist parsing", () => {
  it("parses comma-separated emails", () => {
    const list = parseAllowlist("alice@co.com, bob@co.com");
    expect(list).toEqual(["alice@co.com", "bob@co.com"]);
  });

  it("lowercases emails", () => {
    const list = parseAllowlist("Alice@Co.COM");
    expect(list).toEqual(["alice@co.com"]);
  });

  it("trims whitespace", () => {
    const list = parseAllowlist("  alice@co.com  ,  bob@co.com  ");
    expect(list).toEqual(["alice@co.com", "bob@co.com"]);
  });

  it("filters empty entries from trailing commas", () => {
    const list = parseAllowlist("alice@co.com,,bob@co.com,");
    expect(list).toEqual(["alice@co.com", "bob@co.com"]);
  });

  it("returns empty array for undefined env var", () => {
    const list = parseAllowlist(undefined);
    expect(list).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    const list = parseAllowlist("");
    expect(list).toEqual([]);
  });
});

describe("email allowlist check", () => {
  it("allows any email when allowlist is empty (open access)", () => {
    expect(isEmailAllowed([], "anyone@anywhere.com")).toBe(true);
  });

  it("allows email on the allowlist", () => {
    const list = ["alice@co.com", "bob@co.com"];
    expect(isEmailAllowed(list, "alice@co.com")).toBe(true);
  });

  it("rejects email NOT on the allowlist", () => {
    const list = ["alice@co.com"];
    expect(isEmailAllowed(list, "hacker@evil.com")).toBe(false);
  });

  it("is case-insensitive", () => {
    const list = ["alice@co.com"];
    expect(isEmailAllowed(list, "Alice@Co.COM")).toBe(true);
  });

  it("rejects null email", () => {
    const list = ["alice@co.com"];
    expect(isEmailAllowed(list, null)).toBe(false);
  });

  it("rejects undefined email", () => {
    const list = ["alice@co.com"];
    expect(isEmailAllowed(list, undefined)).toBe(false);
  });

  it("rejects empty string email", () => {
    const list = ["alice@co.com"];
    expect(isEmailAllowed(list, "")).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// The middleware callback logic extracted for testing:
// if (!req.auth && pathname !== "/login") → redirect to /login
// otherwise → next()

function middlewareLogic(auth: unknown, pathname: string, origin: string) {
  if (!auth && pathname !== "/login") {
    const loginUrl = new URL("/login", origin);
    return { type: "redirect" as const, url: loginUrl.toString() };
  }
  return { type: "next" as const };
}

describe("middleware redirect logic", () => {
  const origin = "http://localhost:3000";

  it("redirects unauthenticated user to /login", () => {
    const result = middlewareLogic(null, "/", origin);
    expect(result.type).toBe("redirect");
    expect(result.url).toBe("http://localhost:3000/login");
  });

  it("redirects unauthenticated user from /cohorts to /login", () => {
    const result = middlewareLogic(null, "/cohorts", origin);
    expect(result.type).toBe("redirect");
    expect(result.url).toBe("http://localhost:3000/login");
  });

  it("redirects unauthenticated user from /sites to /login", () => {
    const result = middlewareLogic(null, "/sites", origin);
    expect(result.type).toBe("redirect");
  });

  it("does NOT redirect unauthenticated user already on /login", () => {
    const result = middlewareLogic(null, "/login", origin);
    expect(result.type).toBe("next");
  });

  it("allows authenticated user through on /", () => {
    const result = middlewareLogic({ user: { email: "a@b.com" } }, "/", origin);
    expect(result.type).toBe("next");
  });

  it("allows authenticated user through on /cohorts", () => {
    const result = middlewareLogic(
      { user: { email: "a@b.com" } },
      "/cohorts",
      origin
    );
    expect(result.type).toBe("next");
  });

  it("allows authenticated user to visit /login (no redirect loop)", () => {
    const result = middlewareLogic(
      { user: { email: "a@b.com" } },
      "/login",
      origin
    );
    expect(result.type).toBe("next");
  });
});

describe("middleware matcher config", () => {
  // The matcher regex: /((?!api/auth|_next/static|_next/image|favicon.ico).*)
  const matcherRegex = /^\/((?!api\/auth|_next\/static|_next\/image|favicon\.ico).*)$/;

  it("matches regular app routes", () => {
    expect(matcherRegex.test("/")).toBe(true);
    expect(matcherRegex.test("/sites")).toBe(true);
    expect(matcherRegex.test("/cohorts")).toBe(true);
    expect(matcherRegex.test("/login")).toBe(true);
  });

  it("excludes NextAuth API routes", () => {
    expect(matcherRegex.test("/api/auth/signin")).toBe(false);
    expect(matcherRegex.test("/api/auth/callback/google")).toBe(false);
  });

  it("excludes Next.js static assets", () => {
    expect(matcherRegex.test("/_next/static/chunks/main.js")).toBe(false);
    expect(matcherRegex.test("/_next/image?url=foo")).toBe(false);
  });

  it("excludes favicon", () => {
    expect(matcherRegex.test("/favicon.ico")).toBe(false);
  });

  it("does NOT exclude other API routes (they need auth too)", () => {
    expect(matcherRegex.test("/api/sites")).toBe(true);
    expect(matcherRegex.test("/api/cohorts")).toBe(true);
  });
});

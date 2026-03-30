"use client";

import { useEffect, useState } from "react";

type SessionUser = { name?: string | null; email?: string | null; image?: string | null };

export function UserMenu() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      });
  }, []);

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 hidden sm:block">
        {user.name ?? user.email}
      </span>
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

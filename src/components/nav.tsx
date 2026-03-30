"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

const links = [
  { href: "/", label: "Overview" },
  { href: "/organisations", label: "Orgs" },
  { href: "/cohorts", label: "Cohorts" },
  { href: "/sites", label: "Sites" },
  { href: "/products", label: "Products" },
  { href: "/people", label: "People" },
  { href: "/ac-sites", label: "AC Sites" },
  { href: "/audit", label: "Audit" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 sm:h-16 gap-4 sm:gap-10">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <span className="text-emerald-400 font-display font-bold text-xs sm:text-sm">B</span>
          </div>
          <span className="font-display font-semibold text-zinc-100 tracking-tight text-sm sm:text-base">
            BWC Deploy
          </span>
        </Link>
        <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "text-zinc-100 bg-zinc-800/80"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <UserMenu />
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/clients", label: "Clients" },
  { href: "/cohorts", label: "Cohorts" },
  { href: "/sites", label: "Sites" },
  { href: "/arcs", label: "ARCs" },
  { href: "/people", label: "People" },
  { href: "/ac-sites", label: "AC Sites" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-16 gap-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <span className="text-emerald-400 font-display font-bold text-sm">B</span>
          </div>
          <span className="font-display font-semibold text-zinc-100 tracking-tight">
            BWC Deploy
          </span>
        </Link>
        <div className="flex items-center gap-1">
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
      </div>
    </nav>
  );
}

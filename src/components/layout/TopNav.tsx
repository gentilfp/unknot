"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import {
  PenLine,
  Library,
  GraduationCap,
  Layers,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/buffer", label: "Buffer", icon: PenLine },
  { href: "/library", label: "Library", icon: Library },
  { href: "/study", label: "Study", icon: GraduationCap },
  { href: "/cards", label: "Cards", icon: Layers },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:block">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/buffer"
            className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            Unknot
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/settings"
            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

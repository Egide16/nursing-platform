"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function NavBar({
  label,
  links,
}: {
  label: string;
  links: { href: string; text: string }[];
}) {
  return (
    <div className="flex items-center justify-between max-w-4xl mx-auto px-6 py-5 border-b border-line">
      <div className="flex items-center gap-8">
        <span className="text-sm text-ink font-medium">Meridian &middot; {label}</span>
        <nav className="flex items-center gap-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-slate hover:text-teal">
              {l.text}
            </Link>
          ))}
        </nav>
      </div>
      <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-slate hover:text-clay">
        Sign out
      </button>
    </div>
  );
}

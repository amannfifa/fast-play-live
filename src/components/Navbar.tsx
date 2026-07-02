import { Link } from "@tanstack/react-router";
import { Menu, Search, ScanLine } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-foreground/80 transition hover:bg-secondary"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Search" className="rounded-lg p-2 text-foreground/80 hover:bg-secondary">
            <Search className="h-5 w-5" />
          </button>
          <button aria-label="Scan" className="rounded-lg p-2 text-foreground/80 hover:bg-secondary">
            <ScanLine className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-green to-emerald-600 text-sm font-semibold text-accent-green-foreground">
            G
          </div>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-card">
          <nav className="mx-auto flex max-w-3xl flex-col gap-1 p-3 text-sm">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-secondary">Home</Link>
            <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-secondary">Admin</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
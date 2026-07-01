"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

type DashboardNavProps = {
  email?: string | null;
  signOutAction: (formData?: FormData) => Promise<void>;
};

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/subscriptions', label: 'Suscripciones' },
];

export function DashboardNav({ email, signOutAction }: DashboardNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = 'dashboard-mobile-menu';

  return (
    <>
      {/* Nav centrado — desktop */}
      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-sm font-medium md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`pb-0.5 transition-colors duration-150 ${
              pathname === link.href
                ? 'border-b-2 border-foreground text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Derecha — email + logout */}
      <div className="hidden items-center gap-4 md:flex">
        {email && (
          <span className="text-sm text-muted-foreground">{email}</span>
        )}
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </div>

      {/* Burger mobile */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
        <span className="sr-only">Abrir navegación</span>
      </Button>

      {/* Panel mobile */}
      <div
        id={menuId}
        className={`absolute left-0 top-full w-full border-t border-border bg-card md:hidden z-50 transition-[opacity,transform] duration-200 ease-out origin-top ${
          open
            ? 'opacity-100 scale-y-100 pointer-events-auto'
            : 'opacity-0 scale-y-95 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-5xl space-y-5 px-6 py-5">
          <nav className="grid gap-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-1 py-2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-3 border-t border-border pt-4">
            {email && (
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            )}
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
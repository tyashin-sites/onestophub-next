'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from './Providers';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/products' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-bg/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-light.jpg"
            alt="OneStopHub"
            className="h-12 w-auto rounded-full md:h-16"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold uppercase tracking-wider text-brand-text-muted transition-colors hover:text-brand-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative p-2 text-brand-text-muted transition-colors hover:text-brand-primary"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-brand-primary-contrast">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            className="p-2 text-brand-text-muted md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-brand-border bg-brand-bg md:hidden">
          <nav className="flex flex-col py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

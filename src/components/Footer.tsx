'use client';

import Link from 'next/link';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useCategories } from './Providers';
import { getProductsCategoryHref } from '@/lib/category-routing';

/**
 * Footer is a client component so it can read the live category list from the
 * Providers context. The footer-bar (copyright strip) is rendered by Tyashin's
 * platform layer (see `projects.legalPages.footerBarTheme` and the injected
 * tyashin-runtime), so we don't duplicate it here.
 */
export default function Footer() {
  const { categories } = useCategories();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="OneStopHub"
              className="mb-4 h-20 w-20 rounded-full"
            />
            <p className="text-sm leading-relaxed opacity-80">
              Your one-stop destination for unique gifts, accessories &amp; more. Making every
              occasion special.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'Shop', href: '/products' },
                { label: 'About Us', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm opacity-80 transition-opacity hover:opacity-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Categories</h4>
            <nav className="flex flex-col gap-2">
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat._id}
                  href={getProductsCategoryHref(cat.slug)}
                  className="text-sm opacity-80 transition-opacity hover:opacity-100"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Get In Touch</h4>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:onestophubshop@gmail.com"
                className="flex items-center gap-2 text-sm opacity-80 transition-opacity hover:opacity-100"
              >
                <Mail className="h-4 w-4 shrink-0" /> onestophubshop@gmail.com
              </a>
              <a
                href="tel:+919625912577"
                className="flex items-center gap-2 text-sm opacity-80 transition-opacity hover:opacity-100"
              >
                <Phone className="h-4 w-4 shrink-0" /> +91 96259 12577
              </a>
              <span className="flex items-center gap-2 text-sm opacity-80">
                <MapPin className="h-4 w-4 shrink-0" /> New Delhi, India
              </span>
              <a
                href="https://instagram.com/one.stop_hub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm opacity-80 transition-opacity hover:opacity-100"
              >
                <Instagram className="h-4 w-4 shrink-0" /> @one.stop_hub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

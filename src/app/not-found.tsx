import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-5xl font-semibold text-brand-text">404</h1>
        <p className="mt-2 text-brand-text-muted">We couldn&apos;t find that page.</p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-brand-primary-contrast"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
}

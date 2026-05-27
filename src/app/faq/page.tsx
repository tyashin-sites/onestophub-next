import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about OneStopHub orders, shipping, returns, and customisation.',
};

interface FaqEntry {
  _id: string;
  question: string;
  answer: string;
  order?: number;
}

const PROJECT_ID = process.env.PROJECT_ID || '69dc76525f72612b58028164';
const API_URL = process.env.TYASHIN_API_URL || 'https://website-api.tyashin.com';

async function loadFaqs(): Promise<FaqEntry[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/faq?projectId=${PROJECT_ID}`, {
      headers: { 'X-API-Key': process.env.TYASHIN_API_KEY || '' },
      next: { revalidate: 300 },
    });
    const json = (await res.json()) as { success: boolean; data?: FaqEntry[] };
    return json.success ? json.data ?? [] : [];
  } catch (err) {
    console.error('[faq]', err);
    return [];
  }
}

export default async function FaqPage() {
  const faqs = await loadFaqs();

  // FAQPage schema.org JSON-LD — AEO/GEO bait for ChatGPT/Perplexity citations.
  const jsonLd = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-brand-surface py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-brand-text md:text-4xl">Frequently Asked Questions</h1>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto max-w-3xl px-4">
            {faqs.length === 0 ? (
              <p className="text-center text-brand-text-muted">
                We&apos;re putting together a comprehensive FAQ. In the meantime, contact us at{' '}
                <a className="text-brand-primary hover:underline" href="mailto:onestophubshop@gmail.com">
                  onestophubshop@gmail.com
                </a>{' '}
                or WhatsApp us at{' '}
                <a className="text-brand-primary hover:underline" href="tel:+919625912577">
                  +91 96259 12577
                </a>
                .
              </p>
            ) : (
              <div className="space-y-4">
                {faqs.map((f) => (
                  <details
                    key={f._id}
                    className="group rounded-brand-lg border border-brand-border bg-brand-bg p-5 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="cursor-pointer text-base font-semibold text-brand-text">
                      {f.question}
                    </summary>
                    <div
                      className="mt-3 text-sm leading-relaxed text-brand-text-muted"
                      dangerouslySetInnerHTML={{ __html: f.answer }}
                    />
                  </details>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </div>
  );
}

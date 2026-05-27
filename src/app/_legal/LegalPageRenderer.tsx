import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';

const PROJECT_ID = process.env.PROJECT_ID || '69dc76525f72612b58028164';
const API_URL = process.env.TYASHIN_API_URL || 'https://website-api.tyashin.com';

interface LegalPageData {
  title: string;
  content: string;
  updatedAt?: string;
}

async function loadLegalPage(slug: string): Promise<LegalPageData | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/legal/${slug}?projectId=${PROJECT_ID}&format=json`,
      {
        headers: { 'X-API-Key': process.env.TYASHIN_API_KEY || '' },
        next: { revalidate: 300 },
      },
    );
    const json = (await res.json()) as { success: boolean; data?: LegalPageData };
    return json.success ? json.data ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Renders an admin-edited legal page (T&C / Privacy / Return) inside the
 * site's header + footer chrome. Content is sanitised HTML from the project
 * doc (rich-text editor output).
 */
export default async function LegalPageRenderer({ slug }: { slug: string }) {
  const page = await loadLegalPage(slug);
  if (!page) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-cream py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {page.title}
            </h1>
          </div>
        </section>
        <section className="py-12 md:py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <div
              className="legal-content space-y-4 leading-relaxed text-foreground/85
                [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground
                [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground
                [&_h4]:mt-4 [&_h4]:font-semibold [&_h4]:text-foreground
                [&_p]:mt-3
                [&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80
                [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1
                [&_strong]:font-semibold [&_strong]:text-foreground"
              // Content comes from the admin-side RTE in the Tyashin admin panel
              // — same-origin trust boundary as the rest of legalPages.
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
            {page.updatedAt && (
              <p className="mt-8 text-xs text-muted-foreground">
                Last updated: {new Date(page.updatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

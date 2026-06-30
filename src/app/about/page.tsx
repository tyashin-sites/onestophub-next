import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About Us',
  description:
    'The story behind OneStopHub — founded by Naiya Gandhi Kad, curating thoughtful gifts and personalised hampers for families.',
  path: '/about',
});

const REASONS = [
  'Carefully curated products for kids of all ages',
  'Personalised gifting options for a unique touch',
  'Affordable prices without compromising quality',
  'Fast and reliable delivery across India',
  'A brand built on love, creativity, and care',
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-cream py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">About Us</h1>
            <p className="mt-2 text-muted-foreground">The story behind One Stop Hub</p>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="mb-10 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="OneStopHub" className="h-32 w-32 rounded-full shadow-lg" />
            </div>

            <div className="space-y-6 leading-relaxed text-foreground/85">
              <p>
                <strong className="text-foreground">One Stop Hub</strong> was born out of a simple
                yet heartfelt idea — to make gifting effortless, joyful, and memorable. Founded by{' '}
                <strong>Naiya Gandhi Kad</strong>, a passionate entrepreneur and mother, One Stop
                Hub is a reflection of her love for curating beautiful, thoughtful products for
                children and families.
              </p>
              <p>
                What started as a small venture from home has grown into a vibrant brand that
                brings together a wide range of products — from adorable{' '}
                <strong>hair accessories</strong> and colourful <strong>stationery</strong> to
                creative <strong>DIY kits</strong>, fun <strong>learning games</strong>, and
                elegantly packaged <strong>gift hampers</strong>.
              </p>
              <p>
                At One Stop Hub, we believe that the best gifts come from the heart. Whether
                you&apos;re celebrating a birthday, a festival, a milestone, or simply want to
                bring a smile to a child&apos;s face — we&apos;ve got you covered. Our{' '}
                <strong>personalised gifting</strong> range adds that extra special touch, making
                each gift truly one-of-a-kind.
              </p>

              <h2 className="pt-4 text-2xl font-semibold text-foreground">Our Vision</h2>
              <p>
                To be the go-to destination for parents, families, and gift-givers who value
                quality, creativity, and convenience. We aim to make every occasion — big or small
                — truly special with our handpicked and thoughtfully curated collections.
              </p>

              <h2 className="pt-4 text-2xl font-semibold text-foreground">Why Choose Us?</h2>
              <ul className="list-none space-y-3">
                {REASONS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

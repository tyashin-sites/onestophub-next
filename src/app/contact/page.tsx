import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactForm from './ContactForm';
import { Mail, Phone, MapPin, Instagram, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with OneStopHub for custom orders, bulk hampers, and personalised gifts.',
};

const CONTACT_INFO = [
  { Icon: Mail, label: 'Email', value: 'onestophubshop@gmail.com', href: 'mailto:onestophubshop@gmail.com' },
  { Icon: Phone, label: 'Phone', value: '+91 96259 12577', href: 'tel:+919625912577' },
  { Icon: MapPin, label: 'Location', value: 'New Delhi, India' },
  { Icon: Instagram, label: 'Instagram', value: '@one.stop_hub', href: 'https://instagram.com/one.stop_hub' },
  { Icon: Clock, label: 'Hours', value: 'Mon-Sat: 10AM - 7PM' },
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-cream py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Contact Us</h1>
            <p className="mt-2 text-muted-foreground">We&apos;d love to hear from you</p>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
              <div>
                <h2 className="mb-6 text-2xl font-semibold text-foreground">Get In Touch</h2>
                <div className="space-y-5">
                  {CONTACT_INFO.map(({ Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush/40">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {label}
                        </p>
                        {href ? (
                          <a
                            href={href}
                            target={href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="text-sm text-foreground transition-colors hover:text-primary"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="text-sm text-foreground">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-lg border border-accent/30 bg-blush/20 p-6">
                  <p className="mb-2 text-lg font-semibold text-foreground">Custom Orders</p>
                  <p className="text-sm text-muted-foreground">
                    Looking for something special? WhatsApp us for bulk orders, custom hampers
                    &amp; personalised gifts!
                  </p>
                  <a
                    href="https://wa.me/919625912577"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    Chat on WhatsApp →
                  </a>
                </div>
              </div>

              <div>
                <h2 className="mb-6 text-2xl font-semibold text-foreground">Send a Message</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

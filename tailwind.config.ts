import type { Config } from 'tailwindcss';

/**
 * Brand colours are exposed by the Tyashin platform at /brand-kit.css as CSS
 * custom properties (--brand-primary, --brand-accent, …). We map those into
 * Tailwind tokens here so utilities like `bg-brand-primary text-brand-text`
 * work without hardcoding hex values. Updating the brand kit in the admin
 * panel takes effect immediately — no rebuild needed.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #dabeb2)',
          'primary-contrast': 'var(--brand-primary-contrast, #0a0a0a)',
          accent: 'var(--brand-accent, #e5d9be)',
          bg: 'var(--brand-background, #ffffff)',
          surface: 'var(--brand-surface, #f8f9fb)',
          text: 'var(--brand-text, #0a0a0a)',
          'text-muted': 'var(--brand-text-muted, #525867)',
          border: 'var(--brand-border, #e5e7eb)',
          success: 'var(--brand-success, #16a34a)',
          warning: 'var(--brand-warning, #d97706)',
          danger: 'var(--brand-danger, #dc2626)',
        },
        footer: {
          bg: 'var(--footer-bg, #6b2e38)',
          text: 'var(--footer-text, #fcfaf8)',
          link: 'var(--footer-link, #fcfaf8)',
        },
      },
      borderRadius: {
        'brand-sm': 'var(--brand-radius-sm, 0.375rem)',
        'brand-md': 'var(--brand-radius-md, 0.5rem)',
        'brand-lg': 'var(--brand-radius-lg, 0.75rem)',
      },
      fontFamily: {
        heading: 'var(--brand-heading-font, Inter), Inter, system-ui, sans-serif',
        body: 'var(--brand-body-font, Inter), Inter, system-ui, sans-serif',
      },
    },
  },
  plugins: [],
};

export default config;

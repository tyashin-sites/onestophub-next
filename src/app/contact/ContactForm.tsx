'use client';

import { useState } from 'react';
import { toast, toastError } from '@/components/Providers';

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || '69dc76525f72612b58028164';
const API_URL = process.env.NEXT_PUBLIC_TYASHIN_API_URL || 'https://website-api.tyashin.com';
const API_KEY = process.env.NEXT_PUBLIC_TYASHIN_API_KEY || '';

/**
 * Contact form — POSTs to the Tyashin contact-form endpoint. The Lovable
 * version was a no-op (just a local toast). We make it actually deliver the
 * message via `/api/v1/public/contact`, which writes the submission to D1 and
 * triggers the CRM `onContactFormSubmitted` integration (backend §14).
 */
export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/public/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      });
      const json = (await res.json().catch(() => null)) as { success?: boolean; error?: { message?: string } } | null;
      if (!json?.success) throw new Error(json?.error?.message || 'Failed to send message');
      toast.success("Message sent — we'll get back to you soon.");
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toastError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'text-xs uppercase tracking-wider text-muted-foreground';
  const inputClass =
    'mt-1 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Message</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={inputClass + ' resize-none'}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-primary py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}

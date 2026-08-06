import Link from 'next/link';
import { Truck, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

/**
 * Server-rendered "Delivery & Returns" block on the PDP.
 *
 * Shipping facts come from storeInfo.shippingZones (primary zone), the
 * returns sentence from storeInfo.returnPolicy — the same structured facts
 * that drive the Offer.hasMerchantReturnPolicy JSON-LD, so what Google reads
 * and what the shopper reads can't disagree. The full document is always one
 * click away at /return-policy. Renders nothing it can't back with data.
 */
export default async function DeliveryReturns() {
  let info;
  try {
    const res = await api.getStoreInfo();
    info = res.data;
  } catch {
    return null;
  }

  const zone = Array.isArray(info?.shippingZones) ? info.shippingZones[0] : undefined;
  const rp = info?.returnPolicy;
  if (!zone && !rp) return null;

  const currency = info?.currency || 'INR';
  const days = zone?.estimatedDays;

  let returnsSentence: string | null = null;
  if (rp?.category === 'not-permitted') {
    returnsSentence = `All sales are final. Damaged, defective, or wrong items are replaced or refunded when reported within ${rp.defectiveItemWindowDays ?? 7} days of delivery.`;
  } else if (rp?.category === 'finite' && rp.merchantReturnDays) {
    returnsSentence = `Returns accepted within ${rp.merchantReturnDays} days of delivery${
      rp.returnFees === 'free' ? ' with free return shipping' : ''
    }.`;
  }

  return (
    <div className="mt-8 space-y-3 rounded-lg border border-border p-4">
      {zone && (
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Delivery: </span>
            {typeof zone.rate === 'number' && zone.rate > 0
              ? `${formatPrice(zone.rate, currency)} shipping`
              : 'Free shipping'}
            {typeof zone.freeAbove === 'number' && zone.freeAbove > 0 && (zone.rate ?? 0) > 0
              ? `, free on orders above ${formatPrice(zone.freeAbove, currency)}`
              : ''}
            {days ? ` · arrives in ${days.replace(/\s*days?\s*$/i, '')} days` : ''}
          </p>
        </div>
      )}
      {returnsSentence && (
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Returns: </span>
            {returnsSentence}{' '}
            <Link href="/return-policy" className="text-primary underline hover:opacity-80">
              Read the full policy
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

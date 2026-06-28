/**
 * Public e-commerce API types — kept in sync with the Lovable repo
 * (`hub-of-delights/src/lib/api.ts`). If the backend shape changes,
 * update both call sites in lock-step.
 */

export interface ApiImage {
  url: string;
  alt?: string;
  order: number;
  isPrimary?: boolean;
}

export interface ApiVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  imageUrl?: string;
  isActive: boolean;
}

export interface ApiProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  type: string;
  categoryId: string | null;
  tags: string[];
  price: number;             // smallest currency unit (paise for INR)
  compareAtPrice?: number;
  currency: string;
  sku: string | null;
  stock: number;
  trackInventory: boolean;
  lowStockThreshold?: number;
  taxRate?: number;
  hasVariants: boolean;
  variants: ApiVariant[];
  images: ApiImage[];
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string };
  viewCount: number;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCategory {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  order: number;
  productCount: number;
  isActive?: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  taxRate?: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  discountAmount: number;
  taxAmount?: number;
  taxName?: string;
  taxInclusive?: boolean;
  subtotal: number;
  total: number;
  currency: string;
}

export interface ShippingQuoteMatch {
  zoneId: string;
  name: string;
  rate: number;
  baseRate: number;
  freeAbove: number | null;
  estimatedDays?: string;
}

export interface ShippingQuoteData {
  matched: ShippingQuoteMatch | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  currency?: string;
  reason?: 'NO_MATCH' | 'NO_ZONES' | 'MISSING_COUNTRY';
}

export interface ShippingQuoteRequest {
  country: string;
  region?: string;
  postalCode?: string;
  subtotal?: number;
}

export interface GeoData {
  country?: string;
  region?: string;
  regionName?: string;
  city?: string;
  postalCode?: string;
}

export interface StoreInfo {
  storeName: string;
  currency: string;
  taxName?: string;
  taxRate?: number;
  taxInclusive: boolean;
  requireShippingAddress: boolean;
  requirePhone: boolean;
  enableGuestCheckout: boolean;
  paymentGateway: string;
  enableCod: boolean;
  enableWhatsapp: boolean;
  razorpayKeyId?: string;
  stripePublishableKey?: string;
  shippingCountries?: string[];
  shippingZones: unknown[];
}

export interface CheckoutItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CheckoutRequest {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: 'online' | 'cod' | 'whatsapp';
  customerNote?: string;
  items: CheckoutItemRequest[];
}

export interface CheckoutResponse {
  orderNumber: string;
  stripe?: { clientSecret: string };
  razorpay?: { keyId: string; amount: number; currency: string; orderId: string };
  whatsapp?: { url: string };
}

export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: ApiMeta;
  error?: { code: string; message: string };
}

/* ------------------------------------------------------------------ */
/*  Blog                                                                */
/* ------------------------------------------------------------------ */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentFormat?: 'html' | 'markdown';
  featuredImage?: string;
  authorName?: string;
  categoryId?: string;
  tags?: string[];
  // Pinned/featured posts come back first from the public API (backend sorts
  // pinned-first then newest); surfaced with a "Featured" badge in the list.
  pinned?: boolean;
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string };
  publishedAt?: string;
  viewCount?: number;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  order?: number;
}

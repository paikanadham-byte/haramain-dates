export type Language = 'ar' | 'en';

export type ProductCategory = 
  | 'dates' 
  | 'maamoul' 
  | 'kleija' 
  | 'gifts'
  | 'popular_sweets'
  | 'haramain_packages'
  | 'offers'
  | 'events'
  | 'sweets'
  | 'nuts';

export interface PackSizeOption {
  label: string;        // e.g. "علبة 500 جرام"
  labelEn: string;      // e.g. "500g Box"
  price: number;        // price override for this pack
  sku?: string;         // optional sub-SKU
}

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  category: ProductCategory;
  description: string;
  descriptionEn?: string;
  weight: string;
  weightEn?: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  isFeatured: boolean;
  isHidden: boolean;
  rating: number;
  reviewsCount: number;
  origin?: string;
  originEn?: string;
  sku: string;
  packSizes?: PackSizeOption[]; // optional pack/crate size variants
  unitType?: 'box' | 'kg' | 'pcs'; // sold as a whole box/pack, priced by the kilogram, or sold per piece
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedWeight: string;
  selectedPackSize?: PackSizeOption; // which pack/crate size the customer picked
}

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'mada' | 'applepay' | 'card' | 'cod' | 'tabby' | 'tamara';
export type PaymentStatus = 'paid' | 'pending' | 'refunded';

export interface OrderItem {
  weightEn?: string;
  productId: string;
  productName: string;
  productNameEn?: string;
  productImage: string;
  weight: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    fullName: string;
    mobile: string;
    city: string;
    address: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  shippingCarrier: string;
  trackingNumber?: string;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number; // 15% VAT included
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  moyasarPaymentId?: string;
  refundReason?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  expiresAt: string;
  usageCount: number;
  isActive: boolean;
}

export interface HeroSlide {
  id: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  ctaText: string;
  ctaTextEn?: string;
  ctaLink: string;
  imageUrl: string;
  badge?: string;
  badgeEn?: string;
  isActive?: boolean;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  isEnabled: boolean;
}

export interface CMSContent {
  announcementText: string;
  announcementTextEn?: string;
  announcementEnabled: boolean;
  heroSlides: HeroSlide[];
  promoBanner: {
    title: string;
    titleEn?: string;
    subtitle: string;
    subtitleEn?: string;
    ctaText: string;
    ctaTextEn?: string;
    ctaLink: string;
    imageUrl: string;
  };
  freeShippingThreshold: number;
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    crNumber: string;
    taxNumber: string;
    address: string;
    addressEn?: string;
    mapsUrl?: string;
  };
  social: {
    whatsapp: string;
    instagram: string;
    tiktok: string;
    snapchat: string;
    x: string;
  };
  pixels: {
    metaPixelId: string;
    tiktokPixelId: string;
    snapchatPixelId: string;
    googleAnalyticsId: string;
  };
  paymentGateways?: PaymentGatewayConfig[];
  seo?: {
    metaTitle: string;
    metaTitleEn?: string;
    metaDescriptionEn?: string;
    metaDescription: string;
    metaKeywords: string;
  };
}

export interface ShippingCarrierOption {
  cityRates?: Record<string, number>;
  id: string;
  name: string;
  nameEn: string;
  duration: string;
  durationEn?: string;
  cost: number;
  isEnabled?: boolean;
}

export type ShippingOption = ShippingCarrierOption;

// User & Authentication Types
export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  token?: string;
  favorites?: string[];
  cart?: CartItem[];
}

export interface TimelineMilestone {
  key: string;
  label: string;
  labelEn: string;
  desc: string;
  descEn: string;
  completed: boolean;
  current?: boolean;
  timestamp: string | null;
}

export interface TrackedOrder {
  id: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingCarrier: string;
  trackingNumber: string | null;
  carrierTrackingUrl?: string;
  estimatedDeliveryDate?: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  customerCity?: string;
  customerName?: string;
  customerPhoneMasked?: string;
  items: {
    productId: string;
    productName: string;
    productNameEn?: string;
    productImage: string;
    weight?: string;
    weightEn?: string;
    quantity: number;
    price: number;
  }[];
  timeline: TimelineMilestone[];
  isCancelled?: boolean;
  refundReason?: string;
}

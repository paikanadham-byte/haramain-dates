import {
  Product,
  Coupon,
  CMSContent,
  ShippingCarrierOption,
  Order,
} from "../types";

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SHIPPING_OPTIONS: ShippingCarrierOption[] = [
  {
    id: "smsa",
    name: "سمسا إكسبريس (SMSA Express)",
    nameEn: "SMSA Express Delivery",
    duration: "2-3 أيام عمل",
    durationEn: "2-3 business days",
    cost: 35,
    isEnabled: true,
  },
  {
    id: "aramex",
    name: "أرامكس (Aramex)",
    nameEn: "Aramex Domestic Shipping",
    duration: "3-5 أيام عمل",
    durationEn: "3-5 business days",
    cost: 30,
    isEnabled: true,
  },
  {
    id: "spl",
    name: "سبل البريد السعودي (SPL)",
    nameEn: "Saudi Post (SPL)",
    duration: "4-7 أيام عمل",
    durationEn: "4-7 business days",
    cost: 25,
    isEnabled: true,
  },
];

export const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "بريدة (القصيم)",
  "عنيزة",
  "الأحساء (الهفوف)",
  "الطائف",
  "أبها",
  "خميس مشيط",
  "تبوك",
  "حائل",
  "جازان",
  "نجران",
  "ينبع",
  "الجبيل",
  "حفر الباطن",
  "عرعر",
  "سكاكا",
];

export const INITIAL_CMS: CMSContent = {
  seo: {
    metaTitle: "تمور الحرمين | تمور وضيافة سعودية",
    metaTitleEn: "Tmoor Alharmain | Saudi Dates & Hospitality",
    metaDescription: "تسوق التمور والمعمول والكليجا والمكسرات من تمور الحرمين.",
    metaDescriptionEn:
      "Shop Saudi dates, maamoul, kleija and nuts from Tmoor Alharmain.",
    metaKeywords: "",
  },
  announcementText:
    "✨ شحن مجاني للطلبات فوق 200 ر.س لجميع مدن ومناطق المملكة | جودة مضمونة 100%",
  announcementTextEn:
    "Free shipping on orders over SAR 200 across Saudi Arabia",
  announcementEnabled: false,
  heroSlides: [
    {
      id: "slide-2",
      title: "من بساتين الحرمين إلى مائدتكم",
      titleEn: "From Haramain Orchards to Your Table",
      subtitle: "خلاص وسكري وعجوة — أنقى أنواع التمور تُقطف طازجة وتُشحن إليكم",
      subtitleEn: "Khalas, Sukari and Ajwa — freshly harvested and shipped to you with care",
      ctaText: "اكتشف التشكيلة",
      ctaTextEn: "Explore Collection",
      ctaLink: "#dates",
      imageUrl: "/images/hero-slide-2.png?v=3",
    },
    {
      id: "slide-1",
      title: "ضيافة لا تُنسى بأجود التمور",
      titleEn: "Unforgettable Hospitality, Finest Dates",
      subtitle: "تشكيلة فاخرة من التمور المحشية والكليجا التراثية — مُعدَّة بعناية لضيوفكم",
      subtitleEn: "Premium stuffed dates and traditional kleija — crafted with care for your guests",
      ctaText: "تسوق الآن",
      ctaTextEn: "Shop Now",
      ctaLink: "#products",
      imageUrl: "/images/hero-slide-1.png?v=3",
    },
  ],
  promoBanner: {
    title: "طعم التراث .. بجودة اليوم",
    titleEn: "A taste of heritage, made for today",
    subtitle: "تمور الحرمين .. خيارك الأول للضيافة والإهداء",
    subtitleEn:
      "Thoughtful gifts and exceptional hospitality from Tmoor Alharmain",
    ctaText: "اكتشف منتجاتنا",
    ctaTextEn: "Explore our collection",
    ctaLink: "#products",
    imageUrl: "/images/hero-harvest.jpeg",
  },
  freeShippingThreshold: 200,
  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    crNumber: "",
    taxNumber: "",
    address: "المملكة العربية السعودية",
    addressEn: "Saudi Arabia",
    mapsUrl: "",
  },
  social: {
    whatsapp: "",
    instagram: "",
    tiktok: "",
    snapchat: "",
    x: "",
  },
  pixels: {
    metaPixelId: "",
    tiktokPixelId: "",
    snapchatPixelId: "",
    googleAnalyticsId: "",
  },
};

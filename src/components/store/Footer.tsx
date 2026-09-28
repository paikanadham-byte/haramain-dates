import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { ProductCategory } from "../../types";

export const Footer: React.FC = () => {
  const {
    cms,
    setSelectedCategory,
    setCurrentView,
    language,
    t,
    dir,
    isAdmin,
    setIsLoginModalOpen,
  } = useStore();

  const handleCategoryNav = (cat: ProductCategory) => {
    setSelectedCategory(cat);
    setCurrentView("store");
    const el = document.getElementById("products-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Prefer the owner's exact verified Google Maps link when set (pinpoints the
  // real shop, not just wherever the address text happens to geocode to).
  const displayAddress = (language === "ar" ? cms.contact.address : cms.contact.addressEn) || cms.contact.address;
  const mapsLinkUrl =
    cms.contact.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;
  // The keyless map embed can only do a text search, and a street address
  // alone is often ambiguous enough to land on a different nearby business --
  // prefixing the store name (as it's actually listed on Google) makes the
  // match unique and reliable without needing a Maps API key.
  const mapsEmbedQuery = `${t.brandName}, ${displayAddress}`;

  return (
    <footer
      id="about-section"
      dir={dir}
      className="bg-[#24130A] text-[#E0D0BE] border-t-2 border-[#D8A758] pt-12 pb-8 text-start"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#3E2416]">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt={t.brandName}
                className="w-16 h-16 rounded-xl object-contain bg-[#FAF7F2] border border-[#D8A758]/60 shadow-md p-1"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-lg font-black text-[#FDEBD0]">
                  {t.brandName}
                </h3>
                <span className="text-[10px] tracking-widest text-[#D8A758] block">
                  TMOOR ALHARMAIN
                </span>
              </div>
            </div>

            <p className="text-xs text-[#BC9D81] leading-relaxed">
              {language === "ar"
                ? "علامة سعودية رائدة متخصصة في انتقاء وتعبئة وتصدير أفخر أنواع التمور الملكية، والمعمول والكليجا التراثية بالزبدة الطبيعية ودبس التمر، لنقدم لضيوفكم أصالة وجودة لا تُنسى."
                : "A premier Saudi heritage brand specializing in harvesting, packaging, and delivering the finest royal dates, authentic maamoul, and rich kleija infused with real butter and natural date syrup."}
            </p>

            {/* CR & Tax numbers */}
            {(cms.contact.crNumber || cms.contact.taxNumber) && (
              <div className="text-[11px] text-[#A6876C] space-y-1 bg-[#2F1A0E] p-3 rounded-xl border border-[#482816]">
                <div className="flex justify-between">
                  <span>
                    {language === "ar"
                      ? "السجل التجاري:"
                      : "Commercial Registration:"}
                  </span>
                  <span className="font-mono text-[#D8A758]">
                    {cms.contact.crNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {language === "ar"
                      ? "الرقم الضريبي (ZATCA):"
                      : "Tax / VAT Number:"}
                  </span>
                  <span className="font-mono text-[#D8A758]">
                    {cms.contact.taxNumber}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-[#F3E3CF] pb-2 mb-4 border-b border-[#3E2416] inline-block">
              {language === "ar" ? "أقسام المتجر" : "Store Collections"}
            </h4>
            <ul className="space-y-2 text-xs text-[#BC9D81]">
              <li>
                <button
                  onClick={() => handleCategoryNav("dates")}
                  className="hover:text-[#D8A758] transition-colors cursor-pointer"
                >
                  {language === "ar"
                    ? "تمور خلاص وسكري وعجوة فاخرة"
                    : "Royal Khalas, Sukari & Ajwa Dates"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav("maamoul")}
                  className="hover:text-[#D8A758] transition-colors cursor-pointer"
                >
                  {language === "ar"
                    ? "معمول التمر بالزبدة الطبيعية"
                    : "Date Maamoul with Natural Butter"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav("kleija")}
                  className="hover:text-[#D8A758] transition-colors cursor-pointer"
                >
                  {language === "ar"
                    ? "كليجا القصيم الأصلية بالدبس"
                    : "Authentic Qassim Kleija with Molasses"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav("gifts")}
                  className="hover:text-[#D8A758] transition-colors cursor-pointer"
                >
                  {language === "ar"
                    ? "الباقات والهدايا الفاخرة"
                    : "Premium Packages & Gift Hampers"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav("popular_sweets")}
                  className="hover:text-[#D8A758] transition-colors cursor-pointer"
                >
                  {language === "ar"
                    ? "الحلويات الشعبية السعودية"
                    : "Traditional Saudi Sweets"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav("events")}
                  className="hover:text-[#D8A758] transition-colors cursor-pointer"
                >
                  {language === "ar"
                    ? "ضيافة الأفراح والمناسبات"
                    : "Weddings & Events Catering"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav("haramain_packages")}
                  className="hover:text-[#D8A758] transition-colors font-bold text-[#D8A758] cursor-pointer"
                >
                  {language === "ar"
                    ? "بكجات تمور الحرمين المميزة"
                    : "Haramain Signature Date Packs"}
                </button>
              </li>
              <li className="pt-2 border-t border-[#3E2416]">
                <button
                  onClick={() => setCurrentView("track-order")}
                  className="flex items-center gap-1.5 hover:text-[#D8A758] transition-colors font-bold text-[#F3E3CF] cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-[#D8A758]" />
                  <span>
                    {language === "ar"
                      ? "تتبع الشحنات والطلبات"
                      : "Track Orders & Shipments"}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h4 className="text-sm font-bold text-[#F3E3CF] pb-2 mb-4 border-b border-[#3E2416] inline-block">
              {t.contactUs}
            </h4>
            <ul className="space-y-3 text-xs text-[#BC9D81]">
              {cms.contact.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#D8A758]" />
                  <a
                    dir="ltr"
                    href={`tel:${cms.contact.phone.replace(/[^+\d]/g, "")}`}
                  >
                    {cms.contact.phone}
                  </a>
                </li>
              )}
              {cms.contact.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D8A758]" />
                  <a href={`mailto:${cms.contact.email}`}>
                    {cms.contact.email}
                  </a>
                </li>
              )}
              {cms.contact.address && (
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D8A758]" />
                  <a href={mapsLinkUrl} target="_blank" rel="noreferrer" className="hover:text-[#D8A758] transition-colors">
                    {language === "ar"
                      ? cms.contact.address
                      : cms.contact.addressEn}
                  </a>
                </li>
              )}
            </ul>

            {cms.contact.address && (
              <a
                href={mapsLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block relative rounded-xl overflow-hidden border border-[#482816] h-32 group cursor-pointer"
                title={language === "ar" ? "افتح في خرائط جوجل" : "Open in Google Maps"}
              >
                {/* The embed always uses a text search (a Maps share link like
                    maps.app.goo.gl/... can't be used as an iframe source), so
                    it includes the store name -- the address alone is often
                    ambiguous enough to land on a different nearby business. */}
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapsEmbedQuery)}&z=16&output=embed`}
                  className="w-full h-full pointer-events-none grayscale-[40%] group-hover:grayscale-0 transition-all"
                  loading="lazy"
                  title={language === "ar" ? "موقع المتجر" : "Store location"}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-[#2C1D11] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {language === "ar" ? "افتح في خرائط جوجل" : "Open in Google Maps"}
                  </span>
                </div>
              </a>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(cms.social)
                .filter(([, url]) => /^https:\/\//.test(String(url)))
                .map(([key, url]) => {
                  const labels: Record<string, [string, string]> = {
                    whatsapp: ["واتساب", "WhatsApp"],
                    instagram: ["إنستغرام", "Instagram"],
                    tiktok: ["تيك توك", "TikTok"],
                    snapchat: ["سناب شات", "Snapchat"],
                    x: ["إكس", "X"],
                  };
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs border border-[#715132] hover:bg-white/10 rounded-lg px-3 py-2"
                    >
                      {labels[key]?.[language === "ar" ? 0 : 1] || key}
                    </a>
                  );
                })}
            </div>
          </div>

          {/* Column 4: Admin Portal & Trust */}
          {isAdmin && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#F3E3CF] pb-2 mb-4 border-b border-[#3E2416] inline-block">
                {language === "ar"
                  ? "إدارة المتجر والشحن"
                  : "Store Management & CMS"}
              </h4>

              <div className="bg-[#2F1A0E] border border-[#4A2916] rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 text-[#D8A758] font-bold">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t.adminDashboard} (CMS)</span>
                </div>
                <p className="text-[11px] text-[#A6876C]">
                  {language === "ar"
                    ? "إدارة كاملة للمنتجات والمخزون والأسعار والطلبات والبانرات وفحص السيرفر بدون وسيط."
                    : "Direct, full-fidelity control over catalog, inventory, pricing, coupons, banners, and backend API."}
                </p>
                <button
                  onClick={() => {
                    setCurrentView("admin");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full bg-[#D8A758] hover:bg-[#C49755] text-[#24130A] font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>
                    {language === "ar"
                      ? "فتح لوحة التحكم الإدارية"
                      : "Open Admin Dashboard"}
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-xs text-[#D8A758]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                {language === "ar"
                  ? "تمور الحرمين — ضيافة سعودية أصيلة"
                  : "Tmoor Alharmain — authentic Saudi hospitality"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Payment Logos & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C6D4F]">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {language === "ar"
                ? `جميع الحقوق محفوظة لـ © تمور الحرمين ${new Date().getFullYear()}`
                : `All Rights Reserved © Tmoor Alharmain ${new Date().getFullYear()}`}
            </span>
            <span className="text-[#D8C3A5]">·</span>
            <button
              onClick={() => setCurrentView("privacy")}
              className="underline-offset-2 hover:underline hover:text-[#A66C2E] cursor-pointer"
            >
              {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
            </button>
            <span className="text-[#D8C3A5]">·</span>
            <button
              onClick={() => setCurrentView("track-order")}
              className="underline-offset-2 hover:underline hover:text-[#D8A758] font-semibold cursor-pointer"
            >
              {language === "ar" ? "تتبع الطلبات" : "Track Order"}
            </button>
            <span className="text-[#D8C3A5]">·</span>
            <button
              onClick={() => setCurrentView("terms")}
              className="underline-offset-2 hover:underline hover:text-[#A66C2E] cursor-pointer"
            >
              {language === "ar" ? "شروط الخدمة" : "Terms of Service"}
            </button>
            <span className="text-[#D8C3A5]">·</span>
            <button
              onClick={() => setCurrentView("refund")}
              className="underline-offset-2 hover:underline hover:text-[#A66C2E] cursor-pointer"
            >
              {language === "ar" ? "سياسة الاسترجاع" : "Refund Policy"}
            </button>
          </div>

          {/* Payment Gateways Logos */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#8C6D4F] me-1">
              {language === "ar"
                ? "وسائل الدفع المتاحة:"
                : "Payment methods:"}
            </span>
            <span className="bg-[#059669] text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
              {language === "ar" ? "مدى" : "Mada"}
            </span>
            <span className="bg-black text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
              Apple Pay
            </span>
            <span className="bg-white text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
              VISA
            </span>
            <span className="bg-white text-red-600 font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
              Mastercard
            </span>
            <span className="bg-[#00B27A] text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
              {language === "ar" ? "تمارا" : "Tamara"}
            </span>
            <span className="bg-[#F5F5F5] text-[#3B2213] font-bold text-[10px] px-2 py-0.5 rounded shadow-xs border border-stone-200">
              {language === "ar" ? "الدفع عند الاستلام" : "COD"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

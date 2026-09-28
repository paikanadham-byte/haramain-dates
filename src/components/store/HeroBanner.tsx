import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useStore } from "../../context/StoreContext";

export const HeroBanner: React.FC = () => {
  const { cms, setSelectedCategory, language, t, dir } = useStore();
  const isRtl = dir === "rtl";

  const slides =
    cms.heroSlides && cms.heroSlides.length > 0
      ? cms.heroSlides
      : [
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
            caption: "تمر خلاص فاخر · سكري ملكي · عجوة المدينة",
            captionEn: "Royal Khalas · Premium Sukkari · Medina Ajwa",
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
            caption: "صواني الضيافة الملكية · مع دلة القهوة السعودية",
            captionEn: "Royal Hospitality Platters · Arabic Coffee Companion",
          },
        ];

  const getSlideImageUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("/images/hero-slide") && !url.includes("?v=")) {
      return `${url}?v=3`;
    }
    return url;
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide] || slides[0];

  const handleCtaClick = (link: string) => {
    if (/^https?:\/\//.test(link)) {
      window.location.assign(link);
      return;
    }
    const category = link.replace("#", "");
    setSelectedCategory(
      ["dates", "maamoul", "kleija", "sweets", "nuts", "offers"].includes(category)
        ? (category as any)
        : "all"
    );
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const sTitle = language === "ar" ? slide.title : slide.titleEn || slide.title;
  const sSubtitle = language === "ar" ? slide.subtitle : slide.subtitleEn || slide.subtitle;
  const sCta = language === "ar" ? slide.ctaText : slide.ctaTextEn || slide.ctaText;
  const sCaption = (slide as any).caption
    ? language === "ar"
      ? (slide as any).caption
      : (slide as any).captionEn
    : null;

  return (
    <section className="relative w-full bg-[#F5EEDC] overflow-hidden py-4 sm:py-8 md:py-10 lg:py-14 border-0 outline-none">
      {/* Main Container: Wide container with generous margin on the far left */}
      <div className="w-full max-w-[1840px] mx-auto px-4 sm:px-8 md:pl-12 md:pr-4 lg:pl-16 lg:pr-6 xl:pl-24 xl:pr-8">
        {/* Exact 35% text (remaining) / 65% image split on desktop, no borders, no lines */}
        <div className="grid grid-cols-1 md:grid-cols-[35%_65%] items-center [direction:ltr] w-full">
          
          {/* ============================================================ */}
          {/* TEXT CONTAINER (35% OF SPACE, SHIFTED TO FAR LEFT)          */}
          {/* ============================================================ */}
          <div
            dir={dir}
            className="order-2 md:order-1 relative z-20 flex flex-col justify-center text-start md:pr-6 lg:pr-10 xl:pr-14 pt-4 md:pt-0"
          >
            {/* Tagline */}
            <p className="text-xs sm:text-sm font-semibold text-[#8C5E2E] mb-2.5 flex items-center gap-1.5 tracking-tight">
              <Sparkles className="w-3.5 h-3.5 text-[#B8884A]" />
              <span>{language === "ar" ? "من أرض الحرمين .. إلى كل مكان" : "From The Holy Lands · To The World"}</span>
            </p>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-extrabold text-[#1E0F05] leading-[1.18] mb-3.5 tracking-tighter">
              {sTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-[#4A2810]/90 leading-relaxed mb-6 font-normal sm:font-medium max-w-[38ch]">
              {sSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleCtaClick(slide.ctaLink)}
                className="group inline-flex items-center justify-center gap-2.5 bg-[#B8884A] hover:bg-[#C99550] active:scale-95 text-white font-bold px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm sm:text-base cursor-pointer border-0 outline-none"
              >
                <span>{sCta || t.shopNow}</span>
                {isRtl ? (
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedCategory("offers");
                  document
                    .getElementById("products-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#6B3D14] hover:text-[#1E0F05] border border-[#C59B58]/40 hover:border-[#C59B58] bg-white/75 hover:bg-white px-5 py-3.5 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                {language === "ar" ? "باقات التوفير والضيافة" : "Value & Hospitality Bundles"}
              </button>
            </div>

            {/* Slide Navigation with sleek number counter */}
            {slides.length > 1 && (
              <div className="flex items-center gap-3 mt-8 self-start">
                <button
                  onClick={() => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-[#D8A758]/40 flex items-center justify-center text-[#7A4E28] transition-colors cursor-pointer shadow-2xs"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold text-[#7A4E28]">
                    0{currentSlide + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          currentSlide === i ? "w-7 bg-[#B8884A]" : "w-2 bg-[#7A4E28]/30 hover:bg-[#7A4E28]/60"
                        }`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#7A4E28]/50">
                    0{slides.length}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentSlide((p) => (p + 1) % slides.length)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-[#D8A758]/40 flex items-center justify-center text-[#7A4E28] transition-colors cursor-pointer shadow-2xs"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* PRODUCT IMAGERY (EXACT 65% OF SPACE ON DESKTOP)              */}
          {/* Completely borderless, no box lines, natural soft left blend  */}
          {/* On mobile: 100% unblocked width. On desktop: blends with text */}
          {/* ============================================================ */}
          <div className="order-1 md:order-2 relative w-full h-[320px] sm:h-[420px] md:h-[540px] lg:h-[640px] xl:h-[720px] 2xl:h-[780px]">
            {/* The Image Canvas with no container borders or rounded frame lines */}
            <div className="relative w-full h-full">
              {slides.map((s, i) => (
                <div
                  key={s.id}
                  aria-hidden={i !== currentSlide}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  {/* Clean image: 100% visible on mobile, responsive left blend on desktop */}
                  <img
                    src={getSlideImageUrl(s.imageUrl)}
                    alt={language === "ar" ? s.title : s.titleEn || s.title}
                    className="w-full h-full object-cover object-center hero-mask-mobile hero-mask-desktop"
                  />
                </div>
              ))}

              {/* Floating caption pill */}
              {sCaption && (
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 z-30 pointer-events-none">
                  <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-md border border-[#D8A758]/40 px-3.5 py-1.5 rounded-full shadow-xs text-xs font-bold text-[#4A2810]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8884A] animate-pulse" />
                    <span>{sCaption}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

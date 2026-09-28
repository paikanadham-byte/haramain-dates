import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const HeritagePromoBanner: React.FC = () => {
  const { cms, setSelectedCategory, language, dir } = useStore();
  const banner = cms.promoBanner;
  const imageUrl =
    banner.imageUrl === "/images/promo-dallah.jpg"
      ? "/images/hero-harvest.jpeg"
      : banner.imageUrl || "/images/hero-harvest.jpeg";

  const handleClick = () => {
    const link = banner.ctaLink;
    if (/^https:\/\//.test(link)) { window.location.assign(link); return; }
    const category = link.replace('#','');
    setSelectedCategory(['dates','maamoul','kleija','sweets','nuts','offers'].includes(category) ? category as any : 'all');
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const title = language === 'ar' ? banner.title : (banner.titleEn || banner.title);
  const subtitle = language === 'ar' ? banner.subtitle : (banner.subtitleEn || banner.subtitle);
  const ctaText = language === 'ar' ? banner.ctaText : (banner.ctaTextEn || banner.ctaText);

  return (
    <section dir={dir} className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[#D9C4A9] bg-[#2E180E]">
        {/* Image — shown in full, nothing overlaid on top of the subject */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[420px] bg-[#EADCCB]">
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105"
          />
          {/* Soft fade at the bottom edge only, so the image blends into the text panel below */}
          <div className="absolute inset-x-0 bottom-0 h-14 sm:h-20 bg-gradient-to-t from-[#2E180E] to-transparent pointer-events-none" />
        </div>

        {/* Text panel — separate from the image, so copy never covers the photo */}
        <div className="relative px-6 py-6 sm:px-10 sm:py-8 md:px-12 md:py-10 text-start">
          <div className="inline-flex items-center gap-2 bg-[#D8A758]/20 border border-[#D8A758]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#FBEBD2] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D8A758]" />
            <span>
              {language === 'ar' ? 'أصالة سعودية تتوارثها الأجيال' : 'Saudi Heritage Cherished Across Generations'}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FFF9F0] mb-3 leading-tight">
            {title || 'طعم التراث .. بجودة اليوم'}
          </h3>

          <p className="text-sm sm:text-base md:text-lg text-[#ECD4B9] mb-6 sm:mb-8 leading-relaxed font-medium max-w-2xl">
            {subtitle || 'تمور الحرمين .. خيارك الأول'}
          </p>

          <button
            onClick={handleClick}
            className="group inline-flex items-center gap-2.5 bg-[#C59B58] hover:bg-[#D8AE6B] active:bg-[#B38744] text-[#2C180E] font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <span>{ctaText || (language === 'ar' ? 'اكتشف منتجاتنا' : 'Discover Catalog')}</span>
            {dir === 'rtl' ? (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

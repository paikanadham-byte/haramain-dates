import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory } from '../../types';

interface CategoryCardItem {
  id: ProductCategory;
  title: string;
  titleEn: string;
  image: string;
  image2?: string;
}

export const CategoryShowcase: React.FC = () => {
  const { setSelectedCategory, language, t, dir } = useStore();

  const categories: CategoryCardItem[] = [
    {
      id: 'dates',
      title: 'التمور الفاخرة',
      titleEn: 'Royal Dates',
      image: '/images/hero-dates.jpg'
    },
    {
      id: 'maamoul',
      title: 'المعمول والكليجا',
      titleEn: 'Maamoul & Kleija',
      image: '/images/maamoul.jpg'
    },
    {
      id: 'gifts',
      title: 'الباقات والهدايا',
      titleEn: 'Packages & Gifts',
      image: '/images/gifts-packages.jpg'
    },
    {
      id: 'popular_sweets',
      title: 'الحلويات الشعبية',
      titleEn: 'Traditional Sweets',
      image: '/images/popular-sweets-branded.png'
    },
    {
      id: 'events',
      title: 'ضيافة الأفراح والمناسبات',
      titleEn: 'Weddings & Events',
      image: '/images/wedding-hospitality.jpg'
    },
    {
      id: 'haramain_packages',
      title: 'بكجات تمور الحرمين',
      titleEn: 'Haramain Date Packs',
      image: '/images/haramain-packages.jpg'
    }
  ];

  const handleCategoryClick = (catId: ProductCategory) => {
    setSelectedCategory(catId);
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section dir={dir} className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Section header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-[#3B2213] tracking-tight">
          {language === 'ar' ? 'تصفح تشكيلتنا' : 'Shop by Category'}
        </h2>
        <div className="w-16 h-1 bg-[#C59B58] mx-auto mt-2 rounded-full" />
      </div>

      {/* Responsive grid: 2 cols on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {categories.map(cat => {
          const title = language === 'ar' ? cat.title : cat.titleEn;

          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="group bg-[#F4EDE2] hover:bg-[#EFE5D7] border border-[#E5D7C5] hover:border-[#C59B58] rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-1"
            >
              {/* Square image container - bigger on mobile for visibility */}
              <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 border-2 border-white shadow-md group-hover:scale-105 transition-transform bg-white">
                {cat.image2 ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="w-full h-px bg-white/60" />
                    <div className="flex-1 overflow-hidden">
                      <img
                        src={cat.image2}
                        alt={title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={cat.image}
                    alt={title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Category Title */}
              <h3 className="text-xs sm:text-sm font-bold text-[#3B2213] mb-1 group-hover:text-[#A66C2E] transition-colors leading-tight line-clamp-2">
                {title}
              </h3>

              {/* Shop now link with arrow */}
              <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-[#8C6D4F] group-hover:text-[#3B2213] transition-colors mt-1">
                <span>{t.shopNow}</span>
                {dir === 'rtl' ? (
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

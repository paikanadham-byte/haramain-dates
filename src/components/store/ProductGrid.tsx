import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Filter, ArrowUpDown } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ProductCategory } from '../../types';
import { getCategoryLabel } from '../../utils/translations';

export const ProductGrid: React.FC = () => {
  const {
    products,
    wishlist, wishlistOnly, setWishlistOnly,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    language,
    t,
    dir
  } = useStore();

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  const categories: { id: ProductCategory | 'all'; label: string }[] = [
    { id: 'all', label: getCategoryLabel('all', language) },
    { id: 'dates', label: getCategoryLabel('dates', language) },
    { id: 'maamoul', label: getCategoryLabel('maamoul', language) },
    { id: 'kleija', label: getCategoryLabel('kleija', language) },
    { id: 'gifts', label: getCategoryLabel('gifts', language) },
    { id: 'popular_sweets', label: getCategoryLabel('popular_sweets', language) },
    { id: 'events', label: getCategoryLabel('events', language) },
    { id: 'haramain_packages', label: getCategoryLabel('haramain_packages', language) },
    { id: 'offers', label: getCategoryLabel('offers', language) }
  ];

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => !p.isHidden && (!wishlistOnly || wishlist.includes(p.id)));

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.descriptionEn && p.descriptionEn.toLowerCase().includes(q)) ||
          (p.origin && p.origin.toLowerCase().includes(q)) ||
          (p.originEn && p.originEn.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        return [...list].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
      case 'price-desc':
        return [...list].sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
      case 'rating':
        return [...list].sort((a, b) => b.rating - a.rating);
      case 'featured':
      default:
        return [...list].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
  }, [products, selectedCategory, searchQuery, sortBy, wishlistOnly, wishlist]);

  return (
    <section id="products-section" className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {wishlistOnly && <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{t.wishlist}</h2><button className="text-sm underline" onClick={() => setWishlistOnly(false)}>{language === 'ar' ? 'عرض جميع المنتجات' : 'Show all products'}</button></div>}
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8DDD0]">
        <div className="flex items-center gap-3 text-start">
          {/* Palm star ornament */}
          <div className="w-9 h-9 rounded-full bg-[#F3EADB] text-[#B8873E] flex items-center justify-center border border-[#DECDBB] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#381F11] tracking-tight">
              {searchQuery
                ? `${t.searchResults} "${searchQuery}"`
                : (language === 'ar' ? 'منتجاتنا المميزة والفاخرة' : 'Our Royal & Featured Products')}
            </h2>
            <p className="text-xs text-[#8F7967]">
              {language === 'ar'
                ? 'نقاء الطبيعة وأصالة الضيافة من أرقى مزارع الحرمين الشريفين'
                : 'Pure natural indulgence & royal hospitality directly from heritage groves'}
            </p>
          </div>
        </div>

        {/* View all products link */}
        <button
          onClick={() => {
            setSelectedCategory('all');
            setSearchQuery('');
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#A66C2E] hover:text-[#3B2213] transition-colors cursor-pointer"
        >
          <span>{language === 'ar' ? 'عرض جميع المنتجات' : 'View All Products'}</span>
          {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#3B2213] text-white shadow-xs'
                    : 'bg-white text-[#6E5540] hover:bg-[#F3EADB] border border-[#E3D7C9]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#8C7662]" />
          <span className="text-xs text-[#8C7662] hidden sm:inline">{t.sortBy}</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-white border border-[#DECDBB] rounded-lg py-1.5 px-3 text-xs font-medium text-[#3B2213] focus:outline-hidden focus:border-[#C49755]"
          >
            <option value="featured">{t.sortFeatured}</option>
            <option value="price-asc">{t.sortPriceLow}</option>
            <option value="price-desc">{t.sortPriceHigh}</option>
            <option value="rating">{t.sortRating}</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E8DDD0] p-8">
          <p className="text-base font-bold text-[#3B2213] mb-2">
            {!products.length ? (language === 'ar' ? 'المنتجات غير متاحة حالياً' : 'No products are available yet') : t.noResults}
          </p>
          <p className="text-xs text-[#8F7967] mb-6">
            {!products.length ? (language === 'ar' ? 'يرجى زيارة المتجر مجدداً للاطلاع على المنتجات المتاحة.' : 'Please check back for available products.') : language === 'ar'
              ? 'جرّب البحث بكلمة مختلفة أو تصفح كل الأصناف المتاحة'
              : 'Try searching with different keywords or explore our full catalog'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setWishlistOnly(false);
            }}
            className="bg-[#3B2213] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#52311C] transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'عرض كافة المنتجات' : 'Show All Products'}
          </button>
        </div>
      )}
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, Heart, ShieldCheck, Truck, Check, MessageCircle, Package, Weight, Hash } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getCategoryLabel } from '../../utils/translations';
import { PackSizeOption } from '../../types';

export const ProductDetailModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    wishlist,
    toggleWishlist,
    cms,
    language,
    t,
    dir
  } = useStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [selectedPackSize, setSelectedPackSize] = useState<PackSizeOption | null>(null);

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setAddedAnimation(false);
    // Auto-select first pack size if available
    if (quickViewProduct?.packSizes && quickViewProduct.packSizes.length > 0) {
      setSelectedPackSize(quickViewProduct.packSizes[0]);
    } else {
      setSelectedPackSize(null);
    }
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  const isWishlisted = wishlist.includes(quickViewProduct.id);
  const isOutOfStock = quickViewProduct.stock <= 0;

  // If a pack size is selected, use its price; otherwise use product price
  const currentPrice = selectedPackSize
    ? selectedPackSize.price
    : (quickViewProduct.salePrice ?? quickViewProduct.price);

  const displayName = language === 'ar' ? quickViewProduct.name : quickViewProduct.nameEn;
  const displayDesc = language === 'ar' ? quickViewProduct.description : (quickViewProduct.descriptionEn || quickViewProduct.description);
  const displayWeight = language === 'ar' ? quickViewProduct.weight : (quickViewProduct.weightEn || quickViewProduct.weight);
  const displayOrigin = language === 'ar' ? quickViewProduct.origin : (quickViewProduct.originEn || quickViewProduct.origin);

  const hasPackSizes = quickViewProduct.packSizes && quickViewProduct.packSizes.length > 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(quickViewProduct, quantity, selectedPackSize ?? undefined);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setQuickViewProduct(null);
    }, 600);
  };

  const images = quickViewProduct.images && quickViewProduct.images.length > 0
    ? quickViewProduct.images
    : ['/images/hero-dates.jpg'];

  const whatsappInquiryUrl = `https://wa.me/${cms.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello, I would like to inquire about: ${displayName} (SKU: ${quickViewProduct.sku})`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        dir={dir}
        className="relative bg-white border border-[#E8DDD0] rounded-2xl sm:rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-20 w-9 h-9 rounded-full bg-white/90 text-[#3B2213] hover:bg-[#F3ECE2] flex items-center justify-center transition-colors shadow-sm cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Images Section */}
          <div className="p-6 bg-[#FAF7F2] flex flex-col justify-between border-b md:border-b-0 md:border-e border-[#EFE5D9]">
            {/* Main Display Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-[#EADECE] mb-3">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {quickViewProduct.salePrice != null && !selectedPackSize && (
                <span className={`absolute top-3 ${dir === 'rtl' ? 'right-3' : 'left-3'} bg-[#D97706] text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm`}>
                  {t.saleBadge}
                </span>
              )}
            </div>

            {/* Thumbnails row */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-[#C59B58] scale-95 ring-2 ring-[#C59B58]/30'
                        : 'border-[#EADECE] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-8 flex flex-col justify-between text-start overflow-y-auto max-h-[80vh] md:max-h-[none]">
            <div>
              {/* Category & Origin */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#A66C2E] uppercase tracking-wider">
                  {getCategoryLabel(quickViewProduct.category, language)}
                </span>
                <span className="text-xs text-[#8C7662]">
                  {t.skuPrefix} <span className="font-mono">{quickViewProduct.sku}</span>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-[#2C1D11] mb-2 leading-snug">
                {displayName}
              </h2>

              {/* Pricing */}
              <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-[#EFE5D9]">
                <span className="text-2xl font-black text-[#A66C2E]">
                  {currentPrice} {t.sar}
                </span>
                {quickViewProduct.salePrice != null && !selectedPackSize && (
                  <span className="text-sm text-[#8C7662] line-through">
                    {quickViewProduct.price} {t.sar}
                  </span>
                )}
                <span className="text-xs text-[#8C7662]">
                  {t.vatIncluded}
                </span>
              </div>

              {/* Pack Size Selector */}
              {hasPackSizes && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-[#A66C2E]" />
                    <span className="text-xs font-bold text-[#4B3728]">
                      {language === 'ar' ? 'اختر الحجم / التعبئة:' : 'Choose Pack Size:'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickViewProduct.packSizes!.map((ps, idx) => {
                      const label = language === 'ar' ? ps.label : ps.labelEn;
                      const isSelected = selectedPackSize?.label === ps.label && selectedPackSize?.labelEn === ps.labelEn;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedPackSize(isSelected ? null : ps)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#C59B58] bg-[#FAF5EC] text-[#A66C2E] ring-1 ring-[#C59B58]'
                              : 'border-[#DECDBB] text-[#6E5540] hover:border-[#C59B58] hover:bg-[#FAF5EC]'
                          }`}
                        >
                          <span className="block">{label}</span>
                          <span className="block text-[10px] font-semibold mt-0.5 text-[#A66C2E]">{ps.price} {t.sar}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specs: Weight & Origin */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EFE5D9]">
                  <span className="text-[#8C7662] block mb-0.5">{t.weightPrefix}</span>
                  <span className="font-bold text-[#3B2213] flex items-center gap-1">
                    {quickViewProduct.unitType === 'kg' ? (
                      <Weight className="w-3.5 h-3.5 shrink-0" />
                    ) : quickViewProduct.unitType === 'pcs' ? (
                      <Hash className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Package className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {displayWeight}
                  </span>
                  <span className="block text-[10px] text-[#8C7662] mt-0.5">
                    {quickViewProduct.unitType === 'kg'
                      ? (language === 'ar' ? 'يُباع بالكيلوجرام' : 'Sold by the kilogram')
                      : quickViewProduct.unitType === 'pcs'
                        ? (language === 'ar' ? 'يُباع بالقطعة' : 'Sold by the piece')
                        : (language === 'ar' ? 'يُباع بالصندوق / العلبة' : 'Sold as a box / pack')}
                  </span>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EFE5D9]">
                  <span className="text-[#8C7662] block mb-0.5">{t.originPrefix}</span>
                  <span className="font-bold text-[#3B2213]">{displayOrigin}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#6E5540] leading-relaxed mb-6">
                {displayDesc}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-4 border-t border-[#EFE5D9]">
              {/* Quantity Selector & Add Button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#DECDBB] rounded-xl bg-[#FAF7F2]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-base font-bold text-[#4A2E1A] hover:bg-[#EFE5D9] rounded-s-xl transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-[#3B2213] min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(quickViewProduct.stock, quantity + 1))}
                    disabled={quantity >= quickViewProduct.stock}
                    className="px-3 py-2 text-base font-bold text-[#4A2E1A] hover:bg-[#EFE5D9] rounded-e-xl disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    isOutOfStock
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : addedAnimation
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#3B2213] hover:bg-[#52311C] text-white active:scale-98'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.addedToCart}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#D8A758]" />
                      <span>{isOutOfStock ? t.outOfStock : `${t.addToCart} (${(currentPrice * quantity).toFixed(2)} ${t.sar})`}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => toggleWishlist(quickViewProduct.id)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-[#DECDBB] hover:bg-[#FAF7F2] text-[#6E5540]'
                  }`}
                  title={t.wishlist}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* WhatsApp direct inquiry */}
              {cms.contact.whatsapp && <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#1E7E34] hover:text-[#155724] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>{language === 'ar' ? 'طلب خاص أو استفسار عبر الواتساب' : 'Custom inquiry via WhatsApp'}</span>
              </a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

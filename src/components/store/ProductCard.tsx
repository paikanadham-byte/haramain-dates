import React from 'react';
import { Heart, ShoppingBag, Star, Eye, Package, Weight, Hash } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, wishlist, toggleWishlist, setQuickViewProduct, language, t, dir } = useStore();
  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const displayName = language === 'ar' ? product.name : product.nameEn;
  const displayWeight = language === 'ar' ? product.weight : (product.weightEn || product.weight);
  const displayOrigin = language === 'ar' ? product.origin : (product.originEn || product.origin);

  return (
    <div
      onClick={() => setQuickViewProduct(product)}
      className="group bg-white border border-[#E9DFD3] hover:border-[#C59B58] rounded-xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer relative text-start"
    >
      {/* Top badges & Wishlist */}
      <div className="relative aspect-square w-full bg-[#FAF7F2] overflow-hidden">
        <img
          loading="lazy"
          decoding="async"
          src={product.images[0] || '/images/hero-dates.jpg'}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Sale / Out of stock badges */}
        <div className={`absolute top-2.5 ${dir === 'rtl' ? 'right-2.5' : 'left-2.5'} flex flex-col gap-1.5 z-10`}>
          {isOutOfStock ? (
            <span className="bg-[#B91C1C] text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {t.outOfStock}
            </span>
          ) : product.salePrice != null ? (
            <span className="bg-[#D97706] text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {t.saleBadge}
            </span>
          ) : null}

          {product.stock > 0 && product.stock <= 5 && (
            <span className="bg-[#EAB308] text-[#3B2213] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {t.leftInStock} {product.stock} {t.pieces}
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 ${dir === 'rtl' ? 'left-2.5' : 'right-2.5'} w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-xs ${
            isWishlisted
              ? 'bg-[#B91C1C] text-white'
              : 'bg-white/80 backdrop-blur-xs text-[#6B5645] hover:bg-white hover:text-[#B91C1C]'
          }`}
          title={t.wishlist}
          aria-label={t.wishlist}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-[#2C1D11] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-[#A66C2E]" />
            <span>{t.quickView}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between text-center">
        <div>
          {/* Product Title */}
          <h4 className="text-sm sm:text-base font-bold text-[#2C1D11] group-hover:text-[#A66C2E] transition-colors line-clamp-1 mb-1">
            {displayName}
          </h4>

          {/* Weight / Origin pill */}
          <p className="flex items-center justify-center gap-1 text-xs text-[#8C7662] mb-1.5">
            {product.unitType === 'kg' ? (
              <Weight className="w-3 h-3 shrink-0" />
            ) : product.unitType === 'pcs' ? (
              <Hash className="w-3 h-3 shrink-0" />
            ) : (
              <Package className="w-3 h-3 shrink-0" />
            )}
            {displayWeight} {displayOrigin ? `• ${displayOrigin}` : ''}
          </p>

          {/* Pricing */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {product.salePrice != null ? (
              <>
                <span className="text-base sm:text-lg font-black text-[#A66C2E]">
                  {product.salePrice} {t.sar}
                </span>
                <span className="text-xs text-[#A89381] line-through">
                  {product.price} {t.sar}
                </span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-black text-[#2C1D11]">
                {product.price} {t.sar}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isOutOfStock
              ? 'bg-[#E5DCD2] text-[#8C7662] cursor-not-allowed'
              : 'bg-[#FAF7F2] hover:bg-[#3B2213] text-[#3B2213] hover:text-white border border-[#D5C2AF] hover:border-[#3B2213] active:scale-98 shadow-2xs'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#A66C2E]" />
          <span>{isOutOfStock ? t.outOfStock : t.addToCart}</span>
        </button>
      </div>
    </div>
  );
};

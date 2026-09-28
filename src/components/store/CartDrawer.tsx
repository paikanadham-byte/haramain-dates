import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Truck,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cms,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    setCurrentView,
    language,
    t,
    dir
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isCartOpen) return null;

  const threshold = cms.freeShippingThreshold ?? 200;
  const progressPercent = threshold === 0 ? 100 : Math.min(100, Math.round((cartSubtotal / threshold) * 100));
  const remainingForFreeShipping = Math.max(0, threshold - cartSubtotal);

  const finalEstimatedTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponFeedback({ message: res.message, type: 'success' });
      setCouponInput('');
    } else {
      setCouponFeedback({ message: res.message, type: 'error' });
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      {/* Sliding Panel */}
      <div
        dir={dir}
        className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 text-start"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8DDD0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F3ECE2] text-[#3B2213] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#A66C2E]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3B2213]">{t.cartTitle}</h3>
              <span className="text-xs text-[#8C7662]">
                {cart.length} {language === 'ar' ? (cart.length === 1 ? 'منتج' : 'منتجات') : (cart.length === 1 ? 'item' : 'items')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-[#7A6451] hover:text-[#3B2213] hover:bg-[#F3ECE2] rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div className="px-4 py-3 bg-[#FCF9F5] border-b border-[#EFE5D9]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-[#3B2213] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#A66C2E]" />
              {remainingForFreeShipping > 0 ? (
                <>
                  {t.freeShippingAway} <strong className="text-[#A66C2E] font-bold mx-1">{remainingForFreeShipping.toFixed(2)} {t.sar}</strong> {t.forFreeShipping}
                </>
              ) : (
                <span className="text-emerald-700 font-bold">
                  {t.freeShippingUnlocked}
                </span>
              )}
            </span>
            <span className="text-[11px] text-[#8C7662]">{progressPercent}%</span>
          </div>

          {/* Progress bar track */}
          <div className="w-full bg-[#EADECE] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent >= 100 ? 'bg-emerald-600' : 'bg-[#D8A758]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#F3ECE2] flex items-center justify-center text-[#A66C2E]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#3B2213]">{t.cartEmpty}</h4>
              <p className="text-xs text-[#8C7662] max-w-xs">
                {t.cartEmptyDesc}
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 bg-[#3B2213] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-[#52311C] transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'تصفح تشكيلة التمور' : 'Browse Our Dates'}
              </button>
            </div>
          ) : (
            cart.map(item => {
              const unitPrice = item.product.salePrice ?? item.product.price;
              const itemTotal = unitPrice * item.quantity;
              const displayName = language === 'ar' ? item.product.name : item.product.nameEn;
              const displayWeight = language === 'ar' ? item.selectedWeight : (item.product.weightEn || item.selectedWeight);

              return (
                <div
                  key={item.productId}
                  className="bg-white border border-[#EBE1D5] rounded-xl p-3 flex gap-3 shadow-2xs"
                >
                  <img
                    src={item.product.images[0] || '/images/hero-dates.jpg'}
                    alt={displayName}
                    className="w-16 h-16 rounded-lg object-cover border border-[#EADECE] shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#2C1D11] truncate">
                          {displayName}
                        </h4>
                        <span className="text-[11px] text-[#8C7662]">
                          {displayWeight}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[#A89381] hover:text-[#B91C1C] p-1 transition-colors cursor-pointer"
                        title={language === 'ar' ? 'حذف من السلة' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F5EFE7]">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#DECDBB] rounded-lg bg-[#FAF7F2]">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs font-bold text-[#4A2E1A] hover:bg-[#EFE5D9] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#3B2213] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-2 py-0.5 text-xs font-bold text-[#4A2E1A] hover:bg-[#EFE5D9] disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total for item */}
                      <span className="text-xs sm:text-sm font-black text-[#A66C2E]">
                        {itemTotal.toFixed(2)} {t.sar}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Summary (Visible only if cart has items) */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-[#E8DDD0] space-y-3 shadow-lg">
            {/* Coupon Application Box */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    placeholder={t.couponCode}
                    className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2 px-8 text-xs text-[#3B2213] placeholder-[#9A8674] focus:outline-hidden focus:border-[#C49755]"
                  />
                  <Tag className="w-3.5 h-3.5 text-[#A89381] absolute start-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  className="bg-[#4A2E1A] hover:bg-[#5E3B22] text-[#F3EADB] text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  {t.applyCoupon}
                </button>
              </div>

              {couponFeedback && (
                <div
                  className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                    couponFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {couponFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span>{couponFeedback.message}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg">
                  <span className="font-bold">
                    {appliedCoupon.code} (-{discountAmount.toFixed(2)} {t.sar})
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-red-600 hover:underline text-[11px] cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Remove'}
                  </button>
                </div>
              )}
            </form>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-[#6E5540] pt-2 border-t border-[#F0E6D8]">
              <div className="flex justify-between">
                <span>{t.cartSubtotal}</span>
                <span className="font-bold text-[#3B2213]">{cartSubtotal.toFixed(2)} {t.sar}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>{t.couponDiscount}</span>
                  <span>-{discountAmount.toFixed(2)} {t.sar}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{t.shippingFee}</span>
                <span className="font-bold text-[#3B2213]">
                  {remainingForFreeShipping === 0 ? (
                    <span className="text-emerald-600 font-bold">{t.freeShipping}</span>
                  ) : (
                    `${language === 'ar' ? 'يُحسب عند الدفع' : 'Calculated at checkout'}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-black text-[#2C1D11] pt-2 border-t border-[#EFE5D9]">
                <span>{t.totalAmount}</span>
                <span className="text-base text-[#A66C2E]">{finalEstimatedTotal.toFixed(2)} {t.sar}</span>
              </div>
              <p className="text-[10px] text-[#9A8674] text-start">
                {t.vatIncluded}
              </p>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-[#3B2213] hover:bg-[#52311C] text-white text-xs sm:text-sm font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{t.checkoutButton}</span>
              {dir === 'rtl' ? <ArrowLeft className="w-4 h-4 text-[#D8A758]" /> : <ArrowRight className="w-4 h-4 text-[#D8A758]" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

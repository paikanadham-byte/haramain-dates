import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  Lock,
  Tag,
  Smartphone,
  Banknote
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SAUDI_CITIES } from '../../data/initialData';
import { CITY_NAMES_EN } from '../../utils/cities';
import { PaymentMethod } from '../../types';

const MOYASAR_KEY = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY as string | undefined;

export const CheckoutView: React.FC = () => {
  const {
    cart,
    isBackendConnected,
    cartSubtotal,
    discountAmount,
    appliedCoupon,
    shippingOptions,
    cms,
    placeOrder,
    setCurrentView,
    language,
    t,
    dir,
    currentUser
  } = useStore();

  // Form Fields -- prefilled from the customer's saved profile, if any, so a
  // returning logged-in shopper doesn't have to retype their details every time.
  const [fullName, setFullName] = useState(() => currentUser?.name || '');
  const [mobile, setMobile] = useState(() => currentUser?.phone || '');
  const [city, setCity] = useState(() => currentUser?.city || SAUDI_CITIES[0]);
  const [address, setAddress] = useState(() => currentUser?.address || '');
  const [notes, setNotes] = useState('');

  // currentUser can still be loading when this view first mounts, so fill in any
  // still-empty field once the profile actually arrives -- but only once, so it
  // never overwrites an edit already in progress on a later profile refresh.
  const prefilledFromProfile = useRef(false);
  useEffect(() => {
    if (!currentUser || prefilledFromProfile.current) return;
    prefilledFromProfile.current = true;
    if (!fullName && currentUser.name) setFullName(currentUser.name);
    if (!mobile && currentUser.phone) setMobile(currentUser.phone);
    if (!address && currentUser.address) setAddress(currentUser.address);
    if (currentUser.city) setCity(currentUser.city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Shipping Carrier selection
  const [selectedCarrierId, setSelectedCarrierId] = useState(shippingOptions[0]?.id || 'smsa');

  useEffect(() => {
    if (!shippingOptions.some(c => c.id === selectedCarrierId && c.isEnabled !== false)) setSelectedCarrierId(shippingOptions.find(c => c.isEnabled !== false)?.id || '');
  }, [shippingOptions, selectedCarrierId]);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // Errors & Submitting state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const moyasarContainerRef = useRef<HTMLDivElement>(null);
  const moyasarInstance = useRef<any>(null);

  // Load Moyasar CSS + JS once
  useEffect(() => {
    if (!MOYASAR_KEY) return;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(css); document.head.removeChild(script); };
  }, []);

  // Free shipping check
  const isFreeShipping = cartSubtotal >= (cms.freeShippingThreshold ?? 200);
  const selectedCarrier = shippingOptions.find(c => c.id === selectedCarrierId) || shippingOptions[0];
  const shippingFee = isFreeShipping ? 0 : (selectedCarrier ? (selectedCarrier.cityRates?.[city] ?? selectedCarrier.cost) : 25);

  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = language === 'ar' ? 'يرجى إدخال الاسم الكامل' : 'Please enter full name';
    }
    if (!mobile.trim()) {
      errs.mobile = language === 'ar' ? 'يرجى إدخال رقم الجوال' : 'Please enter mobile number';
    } else if (!/^(05|5)\d{8}$/.test(mobile.replace(/\s+/g, ''))) {
      errs.mobile = language === 'ar' ? 'يرجى إدخال رقم جوال سعودي يبدأ بـ 05' : 'Please enter valid Saudi mobile starting with 05';
    }
    if (!address.trim()) {
      errs.address = language === 'ar' ? 'يرجى إدخال اسم الحي والشارع بالتفصيل' : 'Please enter detailed delivery address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (cart.length === 0) return;

    setIsSubmitting(true);

    // If online payment is selected and Moyasar is configured, launch Moyasar
    if (paymentMethod !== 'cod' && MOYASAR_KEY) {
      (window as any).Moyasar?.init({
        element: '.moyasar-form-wrap',
        amount: Math.round(finalTotal * 100), // halalas
        currency: 'SAR',
        description: language === 'ar' ? 'طلب تمور الحرمين' : 'Tmoor Alharmain Order',
        publishable_api_key: MOYASAR_KEY,
        callback_url: `${window.location.origin}/api/payments/moyasar-callback`,
        methods: paymentMethod === 'mada' ? ['mada'] : paymentMethod === 'applepay' ? ['applepay'] : ['creditcard'],
        on_completed: async (payment: any) => {
          if (payment.status === 'paid') {
            const orderItems = cart.map(item => ({
              productId: item.productId,
              productName: item.product.name,
              productNameEn: item.product.nameEn,
              productImage: item.product.images[0],
              weight: item.selectedWeight,
              price: item.product.salePrice ?? item.product.price,
              quantity: item.quantity
            }));
            await placeOrder({
              customer: { fullName, mobile, city, address, notes: notes.trim() || undefined },
              items: orderItems,
              subtotal: cartSubtotal,
              shippingFee,
              shippingCarrier: selectedCarrierId,
              discountAmount,
              couponCode: appliedCoupon?.code,
              total: finalTotal,
              paymentMethod,
              paymentStatus: 'paid',
              orderStatus: 'new',
              moyasarPaymentId: payment.id,
            });
            setCurrentView('order-success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });
      setIsSubmitting(false);
      return;
    }

    // COD flow
    try {
      const orderItems = cart.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productNameEn: item.product.nameEn,
        productImage: item.product.images[0],
        weight: item.selectedWeight,
        price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity
      }));

      await placeOrder({
        customer: {
          fullName,
          mobile,
          city,
          address,
          notes: notes.trim() || undefined
        },
        items: orderItems,
        subtotal: cartSubtotal,
        shippingFee,
        shippingCarrier: selectedCarrierId,
        discountAmount,
        couponCode: appliedCoupon?.code,
        total: finalTotal,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'new'
      });

      setCurrentView('order-success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors({ submit: language === 'ar' ? 'تعذر إتمام الطلب. تحقق من المخزون والكوبون وشركة الشحن ثم حاول مجدداً.' : (err instanceof Error ? err.message : 'Unable to place order. Please try again.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir={dir} className="max-w-7xl mx-auto px-4 py-8 sm:py-12 text-start">
      {/* Back to store navigation */}
      <button
        onClick={() => setCurrentView('store')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#8C7662] hover:text-[#3B2213] mb-6 transition-colors cursor-pointer"
      >
        {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{t.continueShopping}</span>
      </button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#3B2213] tracking-tight">
          {t.checkoutTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[#8C7662] mt-1">
          {language === 'ar'
            ? 'أكمل بيانات التوصيل واختر شركة الشحن المناسبة'
            : 'Enter your delivery details and choose a shipping company'}
        </p>
      </div>

      {errors.submit && <p role="alert" className="p-4 mb-4 rounded-xl bg-red-50 text-red-700">{errors.submit}</p>}
      {!shippingOptions.some(c => c.isEnabled !== false) && <p role="alert" className="p-4 mb-4 bg-amber-50 text-amber-900 rounded-xl">{language === 'ar' ? 'الشحن غير متاح حالياً. يرجى المحاولة لاحقاً.' : 'Shipping is currently unavailable. Please try again later.'}</p>}
      <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer & Shipping Details */}
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-[#3B2213] flex items-center gap-2 pb-3 border-b border-[#EFE5D9]">
              <MapPin className="w-4 h-4 text-[#A66C2E]" />
              <span>{t.shippingDetails}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                  {t.fullName} <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className={`w-full bg-[#FAF7F2] border rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-hidden focus:border-[#C49755] ${
                      errors.fullName ? 'border-red-400' : 'border-[#DECDBB]'
                    }`}
                  />
                  <User className="w-4 h-4 text-[#8C7662] absolute top-3 start-3" />
                </div>
                {errors.fullName && <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                  {t.mobileNumber} <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className={`w-full bg-[#FAF7F2] border rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-hidden focus:border-[#C49755] ${
                      errors.mobile ? 'border-red-400' : 'border-[#DECDBB]'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-[#8C7662] absolute top-3 start-3" />
                </div>
                {errors.mobile && <p className="text-[11px] text-red-600 mt-1">{errors.mobile}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                  {t.city} <span className="text-red-600">*</span>
                </label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 text-xs text-[#3B2213] focus:outline-hidden focus:border-[#C49755]"
                >
                  {SAUDI_CITIES.map((c, index) => (
                    <option key={c} value={c}>{language === 'ar' ? c : CITY_NAMES_EN[SAUDI_CITIES.indexOf(c)]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                  {t.address} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t.addressPlaceholder}
                  className={`w-full bg-[#FAF7F2] border rounded-xl py-2.5 px-3 text-xs text-[#3B2213] focus:outline-hidden focus:border-[#C49755] ${
                    errors.address ? 'border-red-400' : 'border-[#DECDBB]'
                  }`}
                />
                {errors.address && <p className="text-[11px] text-red-600 mt-1">{errors.address}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                {t.orderNotes}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={language === 'ar' ? 'أي تعليمات خاصة للمندوب أو وقت التسليم المفضل...' : 'Any special courier instructions or preferred delivery time...'}
                className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl p-3 text-xs text-[#3B2213] focus:outline-hidden focus:border-[#C49755]"
              />
            </div>
          </div>

          {/* Step 2: Shipping Options */}
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-[#3B2213] flex items-center gap-2 pb-3 border-b border-[#EFE5D9]">
              <Truck className="w-4 h-4 text-[#A66C2E]" />
              <span>{t.shippingCarrier}</span>
            </h3>

            <div className="space-y-2.5">
              {shippingOptions.filter(c => c.isEnabled !== false).map(carrier => {
                const isSelected = selectedCarrierId === carrier.id;
                const carrierName = language === 'ar' ? carrier.name : (carrier.nameEn || carrier.name);
                const carrierDuration = language === 'ar' ? carrier.duration : (carrier.durationEn || carrier.duration);
                const carrierPrice = carrier.cityRates?.[city] ?? carrier.cost;

                return (
                  <div
                    key={carrier.id}
                    onClick={() => setSelectedCarrierId(carrier.id)}
                    role="radio"
                    tabIndex={0}
                    aria-checked={isSelected}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCarrierId(carrier.id); } }}
                    className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#C59B58] bg-[#FAF5EC] ring-1 ring-[#C59B58]'
                        : 'border-[#EADECE] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#C59B58] bg-[#C59B58]' : 'border-[#DECDBB]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#3B2213] block">
                          {carrierName}
                        </span>
                        <span className="text-[11px] text-[#8C7662]">
                          {carrierDuration}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-[#A66C2E]">
                      {isFreeShipping ? (
                        <span className="text-emerald-700 font-bold">{t.freeShipping}</span>
                      ) : (
                        `${carrierPrice.toFixed(2)} ${t.sar}`
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Payment Method */}
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-[#3B2213] flex items-center gap-2 pb-3 border-b border-[#EFE5D9]">
              <CreditCard className="w-4 h-4 text-[#A66C2E]" />
              <span>{t.paymentMethod}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Cash on Delivery */}
              {([
                { id: 'cod' as PaymentMethod, labelAr: 'الدفع عند الاستلام', labelEn: 'Cash on Delivery', badge: language === 'ar' ? 'نقداً أو شبكة' : 'Cash / POS', icon: <Banknote className="w-5 h-5" />, available: true, note: null },
                { id: 'mada' as PaymentMethod, labelAr: 'مدى', labelEn: 'Mada', badge: language === 'ar' ? 'بطاقة مدى' : 'Debit Card', icon: <CreditCard className="w-5 h-5" />, available: !!MOYASAR_KEY, note: null },
                { id: 'applepay' as PaymentMethod, labelAr: 'Apple Pay', labelEn: 'Apple Pay', badge: language === 'ar' ? 'Apple Pay' : 'Apple Pay', icon: <Smartphone className="w-5 h-5" />, available: !!MOYASAR_KEY, note: null },
                { id: 'card' as PaymentMethod, labelAr: 'فيزا / ماستركارد', labelEn: 'Visa / Mastercard', badge: language === 'ar' ? 'بطاقة ائتمانية' : 'Credit Card', icon: <CreditCard className="w-5 h-5" />, available: !!MOYASAR_KEY, note: null },
                { id: 'tamara' as PaymentMethod, labelAr: 'تمارا — قسّم على 3 أشهر', labelEn: 'Tamara — 3–6 Installments', badge: language === 'ar' ? 'بدون فوائد' : 'No Interest', icon: <CreditCard className="w-5 h-5 text-[#00B27A]" />, available: true, note: language === 'ar' ? 'قسّم مشترياتك على 3 أو 6 دفعات شهرية بدون فوائد عبر تمارا. سنتواصل معك لإتمام الطلب.' : 'Split into 3 or 6 monthly payments with zero interest via Tamara. We will contact you to process.' },
              ]).map(({ id, labelAr, labelEn, badge, icon, available, note }) => (
                <div
                  key={id}
                  onClick={() => available && setPaymentMethod(id)}
                  className={`border rounded-xl p-3.5 flex flex-col gap-2 transition-all ${
                    !available
                      ? 'opacity-50 cursor-not-allowed border-[#EDE3D8] bg-[#FAF7F2]'
                      : paymentMethod === id
                        ? 'border-[#C59B58] bg-[#FAF5EC] ring-1 ring-[#C59B58] cursor-pointer'
                        : 'border-[#EADECE] hover:bg-[#FAF7F2] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === id && available ? 'border-[#C59B58] bg-[#C59B58]' : 'border-[#DECDBB]'
                      }`}>
                        {paymentMethod === id && available && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-[#A66C2E]">{icon}</span>
                      <span className="text-sm font-bold text-[#3B2213]">{language === 'ar' ? labelAr : labelEn}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] bg-[#EADECE] text-[#5C4533] px-1.5 py-0.5 rounded font-medium">{badge}</span>
                      {!available && <span className="text-[9px] text-amber-600 font-bold">{language === 'ar' ? 'قريباً' : 'Coming Soon'}</span>}
                    </div>
                  </div>
                  {note && paymentMethod === id && (
                    <p className="text-[11px] text-[#6E5540] bg-[#FAF0E0] border border-[#E8D8B0] rounded-lg p-2 leading-relaxed">
                      {note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Moyasar form container — rendered dynamically */}
            {paymentMethod !== 'cod' && MOYASAR_KEY && (
              <div ref={moyasarContainerRef} className="moyasar-form-wrap mt-4" />
            )}

            {paymentMethod !== 'cod' && !MOYASAR_KEY && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                {language === 'ar'
                  ? 'سيتم تفعيل الدفع الإلكتروني بعد ربط بوابة موياسر بحساب الشركة.'
                  : 'Online payment will be enabled once Moyasar is connected to the company account. For now, please select Cash on Delivery.'}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-md sticky top-24 space-y-6">
            <h3 className="text-base font-bold text-[#3B2213] pb-3 border-b border-[#EFE5D9]">
              {t.orderSummary} ({cart.length} {language === 'ar' ? 'منتجات' : 'items'})
            </h3>

            {/* Items list */}
            <div className="divide-y divide-[#F3ECE2] max-h-64 overflow-y-auto pe-1">
              {cart.map(item => {
                const unitPrice = item.product.salePrice ?? item.product.price;
                const displayName = language === 'ar' ? item.product.name : item.product.nameEn;
                const displayWeight = language === 'ar' ? item.selectedWeight : (item.product.weightEn || item.selectedWeight);

                return (
                  <div key={item.productId} className="py-2.5 flex items-center gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={displayName}
                      className="w-12 h-12 rounded-lg object-cover border border-[#EADECE]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-[#3B2213] truncate">{displayName}</h5>
                      <span className="text-[11px] text-[#8C7662]">
                        {item.quantity} × {unitPrice} {t.sar} ({displayWeight})
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#A66C2E]">
                      {(unitPrice * item.quantity).toFixed(2)} {t.sar}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Applied Coupon display */}
            {appliedCoupon && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span className="flex items-center gap-1 font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  {t.couponCode}: {appliedCoupon.code}
                </span>
                <span className="font-bold">- {discountAmount.toFixed(2)} {t.sar}</span>
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-[#5C4533] pt-3 border-t border-[#EFE5D9]">
              <div className="flex justify-between">
                <span>{t.cartSubtotal}</span>
                <span className="font-semibold">{cartSubtotal.toFixed(2)} {t.sar}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{t.couponDiscount}</span>
                  <span>- {discountAmount.toFixed(2)} {t.sar}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{t.shippingFee}</span>
                <span className="font-semibold">
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-bold">{t.freeShipping}</span>
                  ) : (
                    `${shippingFee} ${t.sar}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-[#8C7662]">
                <span>{language === 'ar' ? 'ضريبة القيمة المضافة 15% (مشمولة):' : '15% VAT (Included):'}</span>
                <span>{(finalTotal * (15 / 115)).toFixed(2)} {t.sar}</span>
              </div>

              <div className="flex justify-between text-base font-black text-[#3B2213] pt-3 border-t border-[#E8DDD0]">
                <span>{t.totalAmount}</span>
                <span className="text-xl text-[#A66C2E]">{finalTotal.toFixed(2)} {t.sar}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              type="submit"
              disabled={isSubmitting || !cart.length || !isBackendConnected || !shippingOptions.some(c => c.id === selectedCarrierId && c.isEnabled !== false)}
              className="w-full py-3.5 px-4 bg-[#3B2213] hover:bg-[#52311C] active:scale-98 disabled:opacity-75 text-[#FAF7F2] font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{t.processingOrder}</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#D8A758]" />
                  <span>{t.confirmOrder} ({finalTotal.toFixed(2)} {t.sar})</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-[#8C7662] text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.trustQualityTitle}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

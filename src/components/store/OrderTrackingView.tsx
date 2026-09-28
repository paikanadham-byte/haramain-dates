import React, { useState, useEffect } from "react";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Calendar,
  AlertCircle,
  MessageCircle,
  ShoppingBag,
  Printer,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { TrackedOrder } from "../../types";

interface OrderTrackingViewProps {
  initialQuery?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialQuery,
  onClose,
  isModal = false,
}) => {
  const { language, t, dir, setCurrentView, cms, trackingOrderId, setTrackingOrderId } = useStore();
  const [query, setQuery] = useState(initialQuery || trackingOrderId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const fetchTracking = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setError(
        language === "ar"
          ? "يرجى إدخال رقم الطلب أو رقم الجوال أو رقم الشحنة"
          : "Please enter an order ID, mobile number, or tracking number"
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (language === "ar"
              ? "لم يتم العثور على أي طلب يطابق هذا الرقم"
              : "No orders found matching this search")
        );
      }

      setOrders(data.orders || []);
      setSelectedOrderIndex(0);
    } catch (err: any) {
      setOrders([]);
      setError(
        err.message ||
          (language === "ar"
            ? "تعذر جلب بيانات الطلب، يرجى المحاولة لاحقاً"
            : "Failed to load tracking data, please try again")
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount if an initial query or trackingOrderId exists
  useEffect(() => {
    const target = initialQuery || trackingOrderId;
    if (target) {
      setQuery(target);
      fetchTracking(target);
    }
  }, [initialQuery, trackingOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(query);
  };

  const currentOrder = orders[selectedOrderIndex] || null;

  const copyToClipboard = (text: string, type: "order" | "tracking") => {
    navigator.clipboard.writeText(text);
    if (type === "order") {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } else {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: language === "ar" ? "تم التوصيل بنجاح" : "Delivered Successfully",
        };
      case "shipped":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Truck,
          label: language === "ar" ? "تم الشحن مع الناقل" : "Shipped with Carrier",
        };
      case "processing":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Package,
          label: language === "ar" ? "قيد التجهيز والتغليف" : "Preparing & Packaging",
        };
      case "cancelled":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: AlertCircle,
          label: language === "ar" ? "تم إلغاء الطلب" : "Cancelled",
        };
      case "new":
      default:
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: Clock,
          label: language === "ar" ? "تم استلام الطلب" : "Order Placed",
        };
    }
  };

  const sampleOrders = [
    { id: "ORD-882914", label: language === "ar" ? "طلب مشحون (سمسا)" : "Shipped (SMSA)" },
    { id: "ORD-771205", label: language === "ar" ? "قيد التجهيز (أرامكس)" : "Processing (Aramex)" },
    { id: "ORD-993041", label: language === "ar" ? "طلب مستلم (مكة)" : "Delivered (Makkah)" },
    { id: "0501234567", label: language === "ar" ? "بحث برقم الجوال" : "Search by Phone" },
  ];

  return (
    <div dir={dir} className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 text-start">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 bg-[#F3ECE2] border border-[#D8A758]/50 px-4 py-1.5 rounded-full text-xs font-bold text-[#3B2213] mb-3">
          <Truck className="w-4 h-4 text-[#B8884A]" />
          <span>{language === "ar" ? "نظام التتبع المباشر للطلبات" : "Live Order Tracking System"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2C1D11] tracking-tight mb-3">
          {language === "ar" ? "تتبع حالة طلبك وشحنتك" : "Track Your Order & Shipment"}
        </h1>
        <p className="text-sm sm:text-base text-[#6E5540] leading-relaxed">
          {language === "ar"
            ? "أدخل رقم الطلب أو رقم الجوال لمتابعة مسار الشحنة خطوة بخطوة من مستودعاتنا حتى باب مائدتكم."
            : "Enter your order ID or mobile number to follow the progress of your shipment right to your doorstep."}
        </p>
      </div>

      {/* Search Box Card */}
      <div className="bg-white border border-[#E8DDD0] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-lg mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                language === "ar"
                  ? "أدخل رقم الطلب (مثال: ORD-882914) أو رقم الجوال (05xxxxxxxx)"
                  : "Enter order ID (e.g. ORD-882914) or mobile number (05xxxxxxxx)"
              }
              className="w-full bg-[#FAF7F2] border border-[#D8A758]/40 focus:border-[#B8884A] rounded-xl sm:rounded-2xl py-3.5 px-11 text-sm text-[#2C1D11] placeholder-[#8F7967] focus:outline-hidden focus:ring-2 focus:ring-[#B8884A]/20 transition-all text-start"
            />
            <Search className="w-5 h-5 text-[#8F7967] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-[#B8884A] hover:bg-[#C99550] active:scale-95 text-white font-bold px-7 py-3.5 rounded-xl sm:rounded-2xl shadow-md transition-all text-sm sm:text-base cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{language === "ar" ? "جاري التتبع..." : "Tracking..."}</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>{language === "ar" ? "تتبع الشحنة" : "Track Order"}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Search Chips */}
        <div className="mt-4 pt-4 border-t border-[#F0E6D8] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#8C7662] font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#B8884A]" />
            {language === "ar" ? "جرب نماذج طلبات سريعة:" : "Try sample orders:"}
          </span>
          {sampleOrders.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setQuery(s.id);
                fetchTracking(s.id);
              }}
              className="px-3 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE2] border border-[#DECDBB] text-[#4A2810] font-medium transition-colors cursor-pointer"
            >
              <span className="font-bold text-[#B8884A] font-mono">{s.id}</span>
              <span className="text-[11px] text-[#7A5B43] ms-1">({s.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 text-start flex items-start gap-3.5 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-bold mb-1">
              {language === "ar" ? "تعذر العثور على الطلب" : "Order Not Found"}
            </p>
            <p className="text-red-700 leading-relaxed mb-2">{error}</p>
            <p className="text-xs text-red-600">
              {language === "ar"
                ? "يرجى التحقق من صحة الرقم، أو جرب أحد النماذج السريعة بالأعلى، أو تواصل مع خدمة العملاء عبر الواتساب للمساعدة الفورية."
                : "Please check your number, try one of the quick samples above, or contact our WhatsApp support for live assistance."}
            </p>
          </div>
        </div>
      )}

      {/* Multiple Orders Tabs (if searched by mobile) */}
      {orders.length > 1 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-[#6E5540] mb-2">
            {language === "ar"
              ? `تم العثور على (${orders.length}) طلبات مرتبطة برقم الجوال:`
              : `Found (${orders.length}) orders linked to this number:`}
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {orders.map((ord, idx) => {
              const badge = getStatusBadge(ord.orderStatus);
              return (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrderIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedOrderIndex === idx
                      ? "bg-[#3B2213] text-white border-[#3B2213] shadow-md"
                      : "bg-white text-[#4A2810] border-[#DECDBB] hover:bg-[#FAF7F2]"
                  }`}
                >
                  <span className="font-mono">{ord.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}>
                    {badge.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Details & Progress Stepper */}
      {currentOrder && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Status & Order Header Card */}
          <div className="bg-white border border-[#E8DDD0] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F0E6D8]">
              {/* Order ID & Created Date */}
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                  <span className="text-xs text-[#8C7662]">
                    {language === "ar" ? "رقم الطلب:" : "Order ID:"}
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-[#2C1D11] select-all">
                    {currentOrder.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentOrder.id, "order")}
                    className="p-1 rounded-md text-[#8F7967] hover:text-[#2C1D11] hover:bg-[#F3ECE2] transition-colors cursor-pointer"
                    title={language === "ar" ? "نسخ رقم الطلب" : "Copy Order ID"}
                  >
                    {copiedOrderId ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8C7662]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#B8884A]" />
                    {new Date(currentOrder.createdAt).toLocaleDateString(
                      language === "ar" ? "ar-SA" : "en-US",
                      { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                  {currentOrder.customerCity && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#B8884A]" />
                      {currentOrder.customerCity}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Pill Badge */}
              {(() => {
                const badge = getStatusBadge(currentOrder.orderStatus);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-bold shadow-2xs self-start md:self-auto ${badge.bg}`}
                  >
                    <BadgeIcon className="w-4 h-4 shrink-0" />
                    <span>{badge.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Stepper Milestones Progress Bar */}
            <div className="py-8">
              <h3 className="text-xs font-bold text-[#8C7662] uppercase tracking-wider mb-6">
                {language === "ar" ? "مراحل تجهيز وتوصيل الشحنة:" : "Shipment Progress & Timeline:"}
              </h3>

              <div className="relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-5 start-8 end-8 h-1 bg-[#EAE0D2] -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-[#B8884A] to-[#059669] transition-all duration-700"
                    style={{
                      width:
                        currentOrder.orderStatus === "delivered"
                          ? "100%"
                          : currentOrder.orderStatus === "shipped"
                          ? "68%"
                          : currentOrder.orderStatus === "processing"
                          ? "35%"
                          : "5%",
                    }}
                  />
                </div>

                {/* 4 Steps */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative z-10">
                  {currentOrder.timeline.map((step, idx) => {
                    const isCompleted = step.completed;
                    const isCurrent = step.current;

                    return (
                      <div
                        key={step.key}
                        className={`flex md:flex-col items-start md:items-center text-start md:text-center gap-3 md:gap-2.5 p-3 rounded-xl transition-all ${
                          isCurrent
                            ? "bg-[#FAF7F2] border border-[#D8A758]/40 shadow-xs"
                            : ""
                        }`}
                      >
                        {/* Step Icon Node */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                            isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : isCurrent
                              ? "bg-[#B8884A] border-[#B8884A] text-white shadow-md ring-4 ring-[#B8884A]/20 animate-pulse"
                              : "bg-[#F3ECE2] border-[#DECDBB] text-[#9E8472]"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <span className="text-xs font-bold font-mono">0{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Details */}
                        <div>
                          <h4
                            className={`text-xs sm:text-sm font-bold ${
                              isCompleted || isCurrent ? "text-[#2C1D11]" : "text-[#8F7967]"
                            }`}
                          >
                            {language === "ar" ? step.label : step.labelEn}
                          </h4>
                          <p className="text-[11px] text-[#6E5540] mt-0.5 leading-tight">
                            {language === "ar" ? step.desc : step.descEn}
                          </p>
                          {step.timestamp && (
                            <span className="text-[10px] text-[#B8884A] font-medium block mt-1">
                              {new Date(step.timestamp).toLocaleDateString(
                                language === "ar" ? "ar-SA" : "en-US",
                                { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Carrier & Tracking Waybill Info Box */}
            <div className="bg-[#FAF7F2] border border-[#E8DDD0] rounded-2xl p-5 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-[#8C7662] block mb-1">
                  {language === "ar" ? "شركة الشحن الناقلة:" : "Shipping Carrier:"}
                </span>
                <span className="text-sm font-bold text-[#2C1D11] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#B8884A]" />
                  {currentOrder.shippingCarrier || (language === "ar" ? "سمسا إكسبريس" : "SMSA Express")}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#8C7662] block mb-1">
                  {language === "ar" ? "رقم بوليصة الشحن (Tracking #):" : "Tracking / Waybill #:"}
                </span>
                {currentOrder.trackingNumber ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-[#B8884A] select-all">
                      {currentOrder.trackingNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentOrder.trackingNumber!, "tracking")}
                      className="p-1 rounded-md text-[#8F7967] hover:text-[#2C1D11] hover:bg-[#F3ECE2] transition-colors cursor-pointer"
                      title={language === "ar" ? "نسخ رقم البوليصة" : "Copy Tracking #"}
                    >
                      {copiedTracking ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#8F7967] italic">
                    {language === "ar"
                      ? "سيتم تزويدكم برقم البوليصة فور تسليمها للناقل"
                      : "Waybill will be assigned once dispatched"}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-[#8C7662] block mb-1">
                  {language === "ar" ? "الموعد التقريبي للوصول:" : "Estimated Delivery:"}
                </span>
                <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {currentOrder.orderStatus === "delivered"
                    ? language === "ar"
                      ? "تم التوصيل بنجاح"
                      : "Delivered"
                    : language === "ar"
                    ? "خلال 24 - 48 ساعة عمل"
                    : "Within 24 - 48 business hours"}
                </span>
              </div>
            </div>

            {/* Direct Carrier Portal Link */}
            {currentOrder.carrierTrackingUrl && (
              <div className="mt-4 pt-4 border-t border-[#F0E6D8] flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-[#6E5540]">
                  {language === "ar"
                    ? "يمكنكم أيضاً متابعة مسار المركبة وتحديثات السائق مباشرة على موقع شركة الشحن:"
                    : "You can also track vehicle & driver dispatch directly on the carrier portal:"}
                </span>
                <a
                  href={currentOrder.carrierTrackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#B8884A] hover:text-[#8C5E2E] hover:underline"
                >
                  <span>{language === "ar" ? "فتح في بوابة الناقل الرسمية" : "Open Carrier Portal"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Purchased Items & Financial Breakdown Card */}
          <div className="bg-white border border-[#E8DDD0] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
            <h3 className="text-base font-extrabold text-[#2C1D11] mb-4 pb-3 border-b border-[#F0E6D8] flex items-center justify-between">
              <span>{language === "ar" ? "محتويات الطلب" : "Order Items"}</span>
              <span className="text-xs font-bold text-[#8C7662]">
                ({currentOrder.items.length} {language === "ar" ? "منتجات" : "items"})
              </span>
            </h3>

            {/* Items list */}
            <div className="divide-y divide-[#F3ECE2] mb-6">
              {currentOrder.items.map((item, i) => (
                <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-14 h-14 rounded-xl object-cover border border-[#EADECE] shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#2C1D11]">
                        {language === "ar" ? item.productName : item.productNameEn || item.productName}
                      </h4>
                      <p className="text-xs text-[#8C7662] mt-0.5">
                        {(language === "ar" ? item.weight : item.weightEn || item.weight) || "1 كجم"} × {item.quantity} {t.pieces}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-[#B8884A] font-mono whitespace-nowrap">
                    {(item.price * item.quantity).toFixed(2)} {t.sar}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="bg-[#FAF7F2] border border-[#E8DDD0] rounded-2xl p-4 space-y-2 text-xs text-[#6E5540]">
              <div className="flex justify-between">
                <span>{language === "ar" ? "المجموع الفرعي:" : "Subtotal:"}</span>
                <span className="font-bold text-[#2C1D11] font-mono">{currentOrder.subtotal.toFixed(2)} {t.sar}</span>
              </div>

              {currentOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{language === "ar" ? "الخصم المطبق:" : "Applied Discount:"}</span>
                  <span className="font-mono">-{currentOrder.discountAmount.toFixed(2)} {t.sar}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{language === "ar" ? "رسوم الشحن والتوصيل:" : "Shipping Fee:"}</span>
                <span className="font-bold text-[#2C1D11] font-mono">
                  {currentOrder.shippingFee === 0
                    ? language === "ar"
                      ? "مجاني"
                      : "Free"
                    : `${currentOrder.shippingFee.toFixed(2)} ${t.sar}`}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E8DDD0] flex justify-between items-center text-sm sm:text-base font-extrabold text-[#2C1D11]">
                <span>{language === "ar" ? "الإجمالي الكلي (شامل الضريبة):" : "Total (VAT Incl.):"}</span>
                <span className="text-[#B8884A] font-mono">{currentOrder.total.toFixed(2)} {t.sar}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-[#F0E6D8] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* WhatsApp Support button */}
                {cms.contact.whatsapp && (
                  <a
                    href={`https://wa.me/${cms.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      language === "ar"
                        ? `السلام عليكم، أود الاستفسار عن حالة طلبي رقم ${currentOrder.id} من متجر تمور الحرمين.`
                        : `Hello, I'd like to check the status of my order #${currentOrder.id} at Tmoor Alharmain.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{language === "ar" ? "استفسار عبر الواتساب" : "WhatsApp Inquiries"}</span>
                  </a>
                )}

                {/* Print Tracking Receipt */}
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 bg-[#F3ECE2] hover:bg-[#E8DDD0] text-[#3B2213] text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#B8884A]" />
                  <span>{language === "ar" ? "طباعة الإشعار" : "Print Receipt"}</span>
                </button>
              </div>

              {/* Continue Shopping button */}
              <button
                onClick={() => {
                  if (onClose) onClose();
                  setCurrentView("store");
                }}
                className="inline-flex items-center gap-2 bg-[#3B2213] hover:bg-[#52311C] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#D8A758]" />
                <span>{language === "ar" ? "العودة للمتجر والتسوق" : "Continue Shopping"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

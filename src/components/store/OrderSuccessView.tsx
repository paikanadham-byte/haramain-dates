import React, { useEffect } from 'react';
import {
  CheckCircle,
  Truck,
  Printer,
  MessageCircle,
  ShoppingBag,
  MapPin,
  LayoutDashboard,
  Package
} from 'lucide-react';
import { SAUDI_CITIES } from '../../data/initialData';
import { CITY_NAMES_EN } from '../../utils/cities';
import { useStore } from '../../context/StoreContext';

export const OrderSuccessView: React.FC = () => {
  const { lastCompletedOrder, setCurrentView, openOrderTracking, cms, language, t, dir, shippingOptions, isAdmin, setIsLoginModalOpen } = useStore();

  useEffect(() => {
    // Simple canvas confetti celebration
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];
      const colors = ['#C59B58', '#D8A758', '#3B2213', '#059669', '#E5A93C'];

      for (let i = 0; i < 90; i++) {
        particles.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 3,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.7) * 14,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 7 + 4
        });
      }

      let animationId: number;
      let frame = 0;
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.25; // gravity
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        frame++;
        if (frame < 120) {
          animationId = requestAnimationFrame(render);
        } else {
          canvas.remove();
        }
      };
      render();

      return () => {
        cancelAnimationFrame(animationId);
        canvas.remove();
      };
    }
  }, []);

  if (!lastCompletedOrder) {
    return (
      <div dir={dir} className="max-w-xl mx-auto px-4 py-16 text-center">
        <h3 className="text-xl font-bold text-[#3B2213] mb-4">
          {language === 'ar' ? 'لم يتم العثور على طلب أخير' : 'No recent order found'}
        </h3>
        <button
          onClick={() => setCurrentView('store')}
          className="bg-[#3B2213] text-white px-6 py-2 rounded-xl text-sm font-bold cursor-pointer"
        >
          {t.continueShopping}
        </button>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    language === 'ar'
      ? `السلام عليكم، قمت بإتمام الطلب رقم ${lastCompletedOrder.id} بمبلغ ${lastCompletedOrder.total} ر.س من تمور الحرمين.`
      : `Hello, I placed order #${lastCompletedOrder.id} with total ${lastCompletedOrder.total} SAR from Tmoor Alharmain.`
  );

  return (
    <div dir={dir} className="max-w-3xl mx-auto px-4 py-10 sm:py-16 text-start">
      <div className="bg-white border border-[#E8DDD0] rounded-3xl p-6 sm:p-10 shadow-xl text-center relative overflow-hidden">
        {/* Top Gold Ribbon Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C59B58] via-[#E8C589] to-[#C59B58]" />

        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border-2 border-emerald-200 shadow-sm animate-bounce">
          <CheckCircle className="w-10 h-10" />
        </div>

        {/* Title & Tagline */}
        <h2 className="text-2xl sm:text-3xl font-black text-[#381F11] mb-2">
          {t.orderSuccessTitle}
        </h2>
        <p className="text-sm sm:text-base text-[#6E5540] max-w-md mx-auto mb-6">
          {t.orderSuccessDesc}
        </p>

        {/* Order Card Highlight */}
        <div className="bg-[#FAF6F0] border border-[#E8DDD0] rounded-2xl p-5 mb-8 text-start grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-[#8C7662] block mb-0.5">{t.orderNumber}:</span>
            <span className="text-lg font-black text-[#3B2213] font-mono select-all">
              {lastCompletedOrder.id}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#8C7662] block mb-0.5">{t.totalAmount}:</span>
            <span className="text-lg font-black text-[#A66C2E]">
              {lastCompletedOrder.total} {t.sar}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#8C7662] block mb-0.5">{t.shippingCarrier}:</span>
            <span className="text-sm font-bold text-[#3B2213] flex items-center gap-1">
              <Truck className="w-4 h-4 text-[#A66C2E]" />
              {language === 'ar' ? lastCompletedOrder.shippingCarrier : (shippingOptions.find(c => c.name === lastCompletedOrder.shippingCarrier)?.nameEn || lastCompletedOrder.shippingCarrier)}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#8C7662] block mb-0.5">{language === 'ar' ? 'المدينة والتوصيل إلى:' : 'Delivery to:'}</span>
            <span className="text-sm font-bold text-[#3B2213] flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#A66C2E]" />
              {language === 'ar' ? lastCompletedOrder.customer.city : (CITY_NAMES_EN[SAUDI_CITIES.indexOf(lastCompletedOrder.customer.city)] || lastCompletedOrder.customer.city)} - {lastCompletedOrder.customer.fullName}
            </span>
          </div>
        </div>

        {/* Purchased Items Overview */}
        <div className="mb-8 text-start border border-[#EFE5D9] rounded-2xl overflow-hidden bg-[#FCFBF8]">
          <div className="p-3 bg-[#F5ECE0] border-b border-[#E8DDD0] text-xs font-bold text-[#4B3728]">
            {t.orderSummary} ({lastCompletedOrder.items.length})
          </div>
          <div className="divide-y divide-[#F3ECE2] p-2">
            {lastCompletedOrder.items.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-10 h-10 rounded-lg object-cover border border-[#EADECE]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h5 className="font-bold text-[#3B2213]">
                      {language === 'ar' ? item.productName : (item.productNameEn || item.productName)}
                    </h5>
                    <span className="text-[#8C7662]">
                      {language === 'ar' ? item.weight : item.weightEn || ''} × {item.quantity} {t.pieces}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-[#A66C2E]">
                  {(item.price * item.quantity).toFixed(2)} {t.sar}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {/* Track Order Now Button */}
          <button
            onClick={() => openOrderTracking(lastCompletedOrder.id)}
            className="inline-flex items-center gap-2 bg-[#B8884A] hover:bg-[#C99550] active:scale-95 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Package className="w-4 h-4 text-white" />
            <span>{language === 'ar' ? 'تتبع مسار الشحنة والطلب الآن' : 'Track Order Now'}</span>
          </button>

          {/* Print Invoice */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-[#F3ECE2] hover:bg-[#E8DDD0] text-[#3B2213] text-xs sm:text-sm font-bold px-5 py-3 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#A66C2E]" />
            <span>{t.printInvoice}</span>
          </button>

          {/* WhatsApp Confirmation Link */}
          {cms.contact.whatsapp && <a
            href={`https://wa.me/${cms.contact.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{language === 'ar' ? 'تأكيد واستفسار عبر الواتساب' : 'WhatsApp Support'}</span>
          </a>}

          {/* Continue Shopping */}
          <button
            onClick={() => setCurrentView('store')}
            className="inline-flex items-center gap-2 bg-[#3B2213] hover:bg-[#52311C] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#D8A758]" />
            <span>{t.continueShopping}</span>
          </button>
        </div>


      </div>
    </div>
  );
};

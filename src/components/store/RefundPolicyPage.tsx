import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  PackageCheck,
  AlertTriangle,
  Clock,
  Phone,
  ShieldCheck,
  CreditCard,
  Truck,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";

const ICON_MAP = {
  refresh: RefreshCw,
  package: PackageCheck,
  alert: AlertTriangle,
  clock: Clock,
  shield: ShieldCheck,
  card: CreditCard,
  truck: Truck,
  phone: Phone,
} as const;

type IconKey = keyof typeof ICON_MAP;

interface PolicySection {
  icon: IconKey;
  title: string;
  body: string;
  highlight?: string;
}

export const RefundPolicyPage: React.FC = () => {
  const { setCurrentView, cms, language, dir, t } = useStore();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const updated = new Date().toLocaleDateString(
    language === "ar" ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const phone = cms.contact.phone || "";
  const email = cms.contact.email || "";

  const sectionsAr: PolicySection[] = [
    {
      icon: "refresh",
      title: "نظرة عامة على سياسة الاسترجاع",
      body: `نحن في ${t.brandName} نحرص على رضاكم التام. إذا لم تكن راضياً عن طلبك لأي سبب مشروع، يمكنك طلب الاسترجاع أو الاستبدال وفق الشروط الموضحة أدناه. نلتزم بالأنظمة السعودية الصادرة عن وزارة التجارة فيما يخص حقوق المستهلك.`,
    },
    {
      icon: "clock",
      title: "مدة الاسترجاع المقبولة",
      body: "يحق لك طلب الاسترجاع أو الاستبدال خلال مدة أقصاها 7 أيام من تاريخ استلام الطلب. بعد انقضاء هذه المدة لا يمكننا ضمان قبول الطلب إلا في حالات العيب المخفي الموثّق.",
      highlight: "مدة الاسترجاع: 7 أيام من تاريخ الاستلام",
    },
    {
      icon: "package",
      title: "الحالات التي يُقبل فيها الاسترجاع",
      body: "نقبل طلبات الاسترجاع في الحالات التالية:\n• وصول المنتج تالفاً أو به عيب مصنعي.\n• عدم مطابقة المنتج للمواصفات المذكورة في الطلب (نوع التمر أو الوزن أو النكهة).\n• حدوث خطأ في الطلب من جانبنا.\n• انتهاء صلاحية المنتج قبل الاستلام.",
    },
    {
      icon: "alert",
      title: "الحالات التي لا يُقبل فيها الاسترجاع",
      body: "لا يمكن قبول الاسترجاع في الحالات التالية:\n• المنتجات الغذائية القابلة للتلف التي فُتحت أو استُخدمت جزئياً.\n• تغيُّر رأي العميل دون وجود عيب في المنتج.\n• تأخر الإبلاغ عن المشكلة أكثر من 7 أيام بعد الاستلام.\n• المنتجات المخصصة أو المُعدَّة بناءً على طلب خاص.",
    },
    {
      icon: "truck",
      title: "طريقة إعادة المنتج",
      body: `لطلب الاسترجاع يُرجى اتباع الخطوات التالية:\n1. تواصل معنا عبر الجوال ${phone || "(الرقم في صفحة التواصل)"} أو البريد الإلكتروني خلال 7 أيام من الاستلام.\n2. أرسل صوراً واضحة للمنتج التالف أو غير المطابق.\n3. احتفظ بالمنتج بحالته الأصلية وتغليفه إن أمكن.\n4. سيتم التواصل معك خلال 24 ساعة عمل لترتيب الاستلام.`,
    },
    {
      icon: "card",
      title: "آلية استرداد المبلغ",
      body: "• الدفع عند الاستلام (COD): يُستردّ المبلغ نقداً عند استلام المنتج المُعاد، أو عبر تحويل بنكي خلال 3–5 أيام عمل.\n• الدفع الإلكتروني (مدى / فيزا / ماستركارد / Apple Pay): يُعاد المبلغ إلى نفس وسيلة الدفع الأصلية خلال 7–14 يوم عمل حسب سياسة البنك.\n• تمارا: يُستردّ وفق سياسة تمارا للاسترداد المطبّقة على قسط الشراء.",
      highlight: "لا يُطبَّق أي رسوم على عمليات الاسترجاع المشروعة",
    },
    {
      icon: "shield",
      title: "ضمان الجودة",
      body: "جميع منتجاتنا تخضع لفحص دقيق قبل الشحن لضمان الجودة والوزن والطزاجة. في حال وصول أي منتج لا يرقى للمعيار المتوقع، سنتولى استبداله أو استرداد قيمته الكاملة فوراً دون تعقيدات. رضاكم هو مقياس نجاحنا.",
    },
    {
      icon: "phone",
      title: "التواصل معنا للاسترجاع",
      body: `للإبلاغ عن مشكلة أو طلب استرجاع، تواصلوا معنا عبر:\n• الجوال / واتساب: ${phone || "راجع صفحة التواصل"}\n• البريد الإلكتروني: ${email || "راجع صفحة التواصل"}\nوقت الاستجابة: خلال 24 ساعة عمل في أيام الأسبوع.`,
    },
  ];

  const sectionsEn: PolicySection[] = [
    {
      icon: "refresh",
      title: "Refund Policy Overview",
      body: `At ${t.brandName}, your satisfaction is our priority. If you are not fully satisfied with your order for a legitimate reason, you may request a refund or exchange under the conditions outlined below. We comply with Saudi consumer protection regulations issued by the Ministry of Commerce.`,
    },
    {
      icon: "clock",
      title: "Return Window",
      body: "You may request a return or exchange within 7 days from the date of receiving your order. After this period, we cannot guarantee acceptance unless there is a documented hidden defect.",
      highlight: "Return window: 7 days from delivery date",
    },
    {
      icon: "package",
      title: "Accepted Return Cases",
      body: "We accept returns in the following cases:\n• Product arrived damaged or with a manufacturing defect.\n• Product does not match the order specifications (date type, weight, or flavour).\n• An error occurred on our part in fulfilling your order.\n• Product expired before delivery.",
    },
    {
      icon: "alert",
      title: "Non-Returnable Cases",
      body: "We cannot accept returns in the following cases:\n• Perishable food products that have been opened or partially consumed.\n• Change of mind without any product defect.\n• Reporting the issue more than 7 days after delivery.\n• Custom or made-to-order products prepared per special request.",
    },
    {
      icon: "truck",
      title: "Return Process",
      body: `To request a return, please follow these steps:\n1. Contact us via phone ${phone || "(see contact page)"} or email within 7 days of delivery.\n2. Send clear photos of the damaged or non-conforming product.\n3. Keep the product in its original condition and packaging if possible.\n4. We will contact you within 24 business hours to arrange pickup.`,
    },
    {
      icon: "card",
      title: "Refund Method",
      body: "• Cash on Delivery (COD): Refunded in cash upon product pickup, or by bank transfer within 3–5 business days.\n• Electronic Payment (Mada / Visa / Mastercard / Apple Pay): Refunded to the original payment method within 7–14 business days, subject to bank policy.\n• Tamara: Refunded according to Tamara's refund policy applied to the instalment purchase.",
      highlight: "No fees are charged for legitimate return requests",
    },
    {
      icon: "shield",
      title: "Quality Guarantee",
      body: "All our products are carefully inspected before shipping to ensure quality, weight, and freshness. If any product fails to meet the expected standard, we will replace it or issue a full refund immediately without any hassle. Your satisfaction is the measure of our success.",
    },
    {
      icon: "phone",
      title: "Contact Us for Returns",
      body: `To report an issue or request a return, contact us via:\n• Mobile / WhatsApp: ${phone || "see contact page"}\n• Email: ${email || "see contact page"}\nResponse time: within 24 business hours on weekdays.`,
    },
  ];

  const sections = language === "ar" ? sectionsAr : sectionsEn;

  return (
    <div dir={dir} className="min-h-screen bg-[#FAF7F2]">
      {/* Hero Header */}
      <div
        className="bg-gradient-to-br from-[#2C1D11] via-[#3B2213] to-[#1A0D05] text-white py-14 px-4 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #D8A758 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C59B58 0%, transparent 40%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <button
            onClick={() => setCurrentView("store")}
            className="flex items-center gap-2 text-sm font-bold text-[#D8A758] hover:text-[#F0C070] mb-8 cursor-pointer mx-auto transition-colors"
          >
            <BackIcon className="w-4 h-4" />
            <span>
              {language === "ar" ? "العودة للمتجر" : "Back to store"}
            </span>
          </button>

          <div className="w-16 h-16 rounded-full bg-[#D8A758]/20 border border-[#D8A758]/40 flex items-center justify-center mx-auto mb-5">
            <RefreshCw className="w-8 h-8 text-[#D8A758]" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            {language === "ar"
              ? "سياسة الاسترجاع والاستبدال"
              : "Refund & Return Policy"}
          </h1>
          <p className="text-[#D8C3A5] text-sm max-w-xl mx-auto leading-relaxed">
            {language === "ar"
              ? "نضمن لكم حقوقكم الكاملة وفق الأنظمة السعودية — رضاكم أولويتنا"
              : "Your rights are fully guaranteed under Saudi regulations — your satisfaction is our priority"}
          </p>
          <p className="text-xs text-[#8C6D4F] mt-4">
            {language === "ar"
              ? `آخر تحديث: ${updated}`
              : `Last updated: ${updated}`}
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              {
                Icon: Clock,
                labelAr: "7 أيام",
                labelEn: "7 Days",
                descAr: "مدة الاسترجاع",
                descEn: "Return window",
                color: "text-amber-600",
                bg: "bg-amber-50 border-amber-200",
              },
              {
                Icon: RefreshCw,
                labelAr: "استرداد كامل",
                labelEn: "Full Refund",
                descAr: "للحالات المشروعة",
                descEn: "For eligible cases",
                color: "text-emerald-600",
                bg: "bg-emerald-50 border-emerald-200",
              },
              {
                Icon: CreditCard,
                labelAr: "7–14 يوم",
                labelEn: "7–14 Days",
                descAr: "معالجة الاسترداد الإلكتروني",
                descEn: "Online refund processing",
                color: "text-blue-600",
                bg: "bg-blue-50 border-blue-200",
              },
            ] as const
          ).map(({ Icon, labelAr, labelEn, descAr, descEn, color, bg }) => (
            <div
              key={labelAr}
              className={`rounded-2xl border p-5 text-center shadow-sm ${bg}`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
              <div className={`text-lg font-black ${color}`}>
                {language === "ar" ? labelAr : labelEn}
              </div>
              <div className="text-xs text-[#5A4433] mt-1">
                {language === "ar" ? descAr : descEn}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Sections */}
      <div className="max-w-3xl mx-auto px-4 pb-16 text-start space-y-6">
        {sections.map((section, idx) => {
          const Icon = ICON_MAP[section.icon];
          return (
            <section
              key={section.title}
              className="bg-white rounded-2xl border border-[#E8DCCC] shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#FAF2E8] to-[#FDF8F2] border-b border-[#E8DCCC]">
                <div className="w-8 h-8 rounded-lg bg-[#D8A758]/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#A66C2E]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#D8A758] bg-[#D8A758]/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <h2 className="text-sm font-bold text-[#3B2213]">
                    {section.title}
                  </h2>
                </div>
              </div>
              <div className="px-6 py-5">
                {section.highlight && (
                  <div className="mb-4 bg-[#FFF8E6] border border-[#F0C86A] rounded-xl px-4 py-2.5 text-sm font-bold text-[#8C5A00] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    {section.highlight}
                  </div>
                )}
                <p className="text-sm leading-relaxed text-[#5A4433] whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            </section>
          );
        })}

        {/* CTA Block */}
        <div className="bg-gradient-to-br from-[#2C1D11] to-[#3B2213] text-white rounded-2xl p-6 text-center shadow-lg">
          <Phone className="w-8 h-8 text-[#D8A758] mx-auto mb-3" />
          <h3 className="text-lg font-black mb-2">
            {language === "ar" ? "هل تحتاج مساعدة؟" : "Need Help?"}
          </h3>
          <p className="text-sm text-[#D8C3A5] mb-5 leading-relaxed">
            {language === "ar"
              ? "فريقنا جاهز لمساعدتك في أي استفسار أو طلب استرجاع، تواصل معنا بكل ثقة."
              : "Our team is ready to assist you with any inquiry or return request. Reach out with confidence."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {phone && (
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="bg-[#D8A758] hover:bg-[#C49755] text-[#24130A] font-bold text-sm py-2.5 px-6 rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                {phone}
              </a>
            )}
            <button
              onClick={() => setCurrentView("store")}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm py-2.5 px-6 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              {language === "ar" ? "العودة للمتجر" : "Back to Store"}
            </button>
          </div>
        </div>

        {/* Links to related policies */}
        <div className="flex flex-wrap gap-3 pt-2 justify-center">
          <button
            onClick={() => setCurrentView("privacy")}
            className="text-xs text-[#8C6D4F] hover:text-[#A66C2E] underline-offset-2 hover:underline transition-colors cursor-pointer"
          >
            {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
          </button>
          <span className="text-[#D8C3A5] text-xs">·</span>
          <button
            onClick={() => setCurrentView("terms")}
            className="text-xs text-[#8C6D4F] hover:text-[#A66C2E] underline-offset-2 hover:underline transition-colors cursor-pointer"
          >
            {language === "ar" ? "شروط الخدمة" : "Terms of Service"}
          </button>
        </div>
      </div>
    </div>
  );
};

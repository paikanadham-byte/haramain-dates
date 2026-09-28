import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const TermsOfServicePage: React.FC = () => {
  const { setCurrentView, cms, language, dir, t } = useStore();
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const updated = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sectionsAr = [
    {
      title: 'قبول الشروط',
      body: `يشكّل استخدامك لموقع "${t.brandName}" وإتمام أي طلب من خلاله موافقة كاملة منك على شروط الخدمة الموضحة هنا. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع.`,
    },
    {
      title: 'الطلبات والأسعار',
      body: 'جميع الأسعار المعروضة بالريال السعودي وتشمل ضريبة القيمة المضافة. نحتفظ بالحق في تعديل الأسعار والمنتجات المتاحة في أي وقت دون إشعار مسبق. يُعتبر الطلب مؤكداً فقط بعد استلام تأكيد من المتجر.',
    },
    {
      title: 'طرق الدفع',
      body: 'يتوفر حالياً الدفع عند الاستلام (COD) فقط. عند تفعيل الدفع الإلكتروني، ستتم إضافة خيارات دفع سعودية معتمدة (مثل مدى وApple Pay والبطاقات الائتمانية) عبر بوابة دفع مرخصة.',
    },
    {
      title: 'الشحن والتوصيل',
      body: 'تعتمد رسوم ومدة الشحن على المدينة وشركة الشحن المختارة كما هو موضح عند إتمام الطلب. يبذل المتجر جهده لتوصيل الطلبات ضمن المدة المتوقعة، لكن التأخير الناتج عن ظروف شركة الشحن خارج عن إرادتنا.',
    },
    {
      title: 'الإلغاء والإرجاع',
      body: 'يمكن إلغاء الطلب طالما لم يتم شحنه أو تحصيل قيمته. نظراً لطبيعة المنتجات الغذائية، لا يُقبل الإرجاع بعد التسليم إلا في حال وجود عيب واضح في المنتج أو خطأ في الطلب المُستلم، ويجب الإبلاغ عن ذلك خلال 24 ساعة من الاستلام عبر بيانات التواصل أدناه.',
    },
    {
      title: 'الحسابات والاستخدام المقبول',
      body: 'أنت مسؤول عن الحفاظ على سرية بيانات دخولك، وعن دقة المعلومات التي تقدمها عند إنشاء الحساب أو تقديم الطلب. يُمنع استخدام الموقع لأي غرض غير قانوني أو لمحاولة الوصول غير المصرح به لأنظمة المتجر.',
    },
    {
      title: 'الملكية الفكرية',
      body: `جميع المحتويات المعروضة على الموقع، بما في ذلك الشعار والصور والنصوص، هي ملك لـ"${t.brandName}" ولا يجوز استخدامها أو نسخها دون إذن كتابي مسبق.`,
    },
    {
      title: 'حدود المسؤولية',
      body: 'يُقدَّم الموقع "كما هو"، ونسعى دوماً لدقة المعلومات المعروضة لكننا لا نضمن خلوها التام من الأخطاء. لا يتحمل المتجر مسؤولية أي أضرار غير مباشرة ناتجة عن استخدام الموقع خارج نطاق سيطرتنا المباشرة.',
    },
    {
      title: 'القانون المُطبَّق',
      body: 'تخضع هذه الشروط وتُفسَّر وفقاً لأنظمة المملكة العربية السعودية، وتختص المحاكم السعودية بالنظر في أي نزاع ينشأ عنها.',
    },
    {
      title: 'التواصل معنا',
      body: `لأي استفسار بخصوص هذه الشروط، تواصل معنا عبر البريد الإلكتروني ${cms.contact.email || 'غير متوفر حالياً'}${cms.contact.phone ? ` أو الهاتف ${cms.contact.phone}` : ''}.`,
    },
  ];

  const sectionsEn = [
    {
      title: 'Acceptance of terms',
      body: `By using ${t.brandName} and placing any order through this site, you fully agree to the Terms of Service described here. If you do not agree with any part of these terms, please do not use the site.`,
    },
    {
      title: 'Orders and pricing',
      body: 'All prices are shown in Saudi Riyals and include VAT. We reserve the right to change prices and product availability at any time without prior notice. An order is only confirmed once you receive confirmation from the store.',
    },
    {
      title: 'Payment methods',
      body: 'Cash on delivery (COD) is currently the only available payment method. When online payment is enabled, licensed Saudi payment options (such as Mada, Apple Pay and credit cards) will be added through a regulated payment gateway.',
    },
    {
      title: 'Shipping and delivery',
      body: 'Shipping fees and delivery time depend on your city and the chosen carrier, as shown at checkout. We do our best to deliver within the estimated timeframe, but delays caused by the shipping carrier are outside our control.',
    },
    {
      title: 'Cancellation and returns',
      body: "An order can be cancelled as long as it hasn't been shipped or its payment collected. Due to the perishable nature of our products, returns after delivery are only accepted for a clear product defect or an incorrect item received, and must be reported within 24 hours of delivery using the contact details below.",
    },
    {
      title: 'Accounts and acceptable use',
      body: 'You are responsible for keeping your login details confidential and for the accuracy of the information you provide when creating an account or placing an order. Using the site for any unlawful purpose, or attempting unauthorized access to our systems, is prohibited.',
    },
    {
      title: 'Intellectual property',
      body: `All content on this site, including the logo, images and text, belongs to ${t.brandName} and may not be used or copied without prior written permission.`,
    },
    {
      title: 'Limitation of liability',
      body: 'This site is provided "as is." We work to keep information accurate but do not guarantee it is entirely error-free. The store is not liable for indirect damages arising from use of the site that are outside our direct control.',
    },
    {
      title: 'Governing law',
      body: 'These terms are governed by and interpreted in accordance with the laws of the Kingdom of Saudi Arabia, and Saudi courts have exclusive jurisdiction over any dispute arising from them.',
    },
    {
      title: 'Contact us',
      body: `For any question about these terms, contact us at ${cms.contact.email || 'the email listed on our site'}${cms.contact.phone ? ` or by phone at ${cms.contact.phone}` : ''}.`,
    },
  ];

  const sections = language === 'ar' ? sectionsAr : sectionsEn;

  return (
    <div dir={dir} className="max-w-3xl mx-auto px-4 py-10 sm:py-14 text-start">
      <button
        onClick={() => setCurrentView('store')}
        className="flex items-center gap-2 text-sm font-bold text-[#8C6D4F] hover:text-[#A66C2E] mb-8 cursor-pointer"
      >
        <BackIcon className="w-4 h-4" />
        <span>{language === 'ar' ? 'العودة للمتجر' : 'Back to store'}</span>
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#3B2213] mb-2">
        {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
      </h1>
      <p className="text-xs text-[#8F7967] mb-10">
        {language === 'ar' ? `آخر تحديث: ${updated}` : `Last updated: ${updated}`}
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-[#3B2213] mb-2">{section.title}</h2>
            <p className="text-sm leading-relaxed text-[#5A4433]">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

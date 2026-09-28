import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const PrivacyPolicyPage: React.FC = () => {
  const { setCurrentView, cms, language, dir, t } = useStore();
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const updated = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sectionsAr = [
    {
      title: 'مقدمة',
      body: `توضح سياسة الخصوصية هذه كيفية جمع "${t.brandName}" لبياناتك الشخصية واستخدامها وحمايتها عند استخدامك لمتجرنا الإلكتروني. باستخدامك للموقع فإنك توافق على الممارسات الموضحة أدناه.`,
    },
    {
      title: 'البيانات التي نجمعها',
      body: 'نجمع فقط البيانات اللازمة لإتمام طلبك وتحسين خدمتنا: الاسم، رقم الجوال، المدينة والعنوان التفصيلي، والبريد الإلكتروني إذا قمت بإنشاء حساب أو تسجيل الدخول عبر جوجل. كما نحتفظ تلقائياً بسجل الطلبات والسلة وقائمة المفضلة المرتبطة بحسابك لتسهيل تسوقك.',
    },
    {
      title: 'كيف نستخدم بياناتك',
      body: 'تُستخدم بياناتك حصراً لمعالجة الطلبات وتوصيلها، والتواصل معك بخصوص حالة الطلب، وتحسين تجربة التسوق. لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث لأغراض تسويقية.',
    },
    {
      title: 'تسجيل الدخول عبر جوجل',
      body: 'إذا اخترت تسجيل الدخول باستخدام حساب جوجل، فإننا نستلم فقط اسمك وبريدك الإلكتروني من جوجل لإنشاء حسابك لدينا؛ ولا نصل إلى كلمة مرور حساب جوجل الخاص بك ولا إلى أي بيانات أخرى فيه.',
    },
    {
      title: 'ملفات تعريف الارتباط (Cookies)',
      body: 'نستخدم ملف تعريف ارتباط واحداً أساسياً (HttpOnly) للحفاظ على جلسة تسجيل دخولك بأمان. لا نستخدم حالياً أدوات تتبع إعلانية أو تحليلية من أطراف ثالثة.',
    },
    {
      title: 'أمان البيانات',
      body: 'يتم تخزين بياناتك على خوادم قاعدة بيانات مشفّرة (Neon PostgreSQL) عبر اتصال مشفّر بالكامل (SSL/TLS)، وتُحفظ كلمات المرور بصيغة مجزأة (مشفّرة) غير قابلة للاسترجاع.',
    },
    {
      title: 'الدفع',
      body: 'خدمة الدفع الحالية هي الدفع عند الاستلام فقط. عند تفعيل الدفع الإلكتروني مستقبلاً، ستتم معالجة بيانات البطاقة مباشرة عبر بوابة دفع سعودية معتمدة، ولن يقوم متجرنا بتخزين بيانات بطاقتك البنكية على الإطلاق.',
    },
    {
      title: 'حقوقك',
      body: 'يحق لك في أي وقت طلب الاطلاع على بياناتك المخزنة لدينا، أو تصحيحها، أو حذف حسابك وبياناته بشكل كامل. للتواصل بخصوص أي من هذه الطلبات، يرجى مراسلتنا عبر بيانات التواصل أدناه.',
    },
    {
      title: 'التواصل معنا',
      body: `لأي استفسار يخص هذه السياسة أو بياناتك الشخصية، يمكنك التواصل عبر البريد الإلكتروني ${cms.contact.email || 'غير متوفر حالياً'}${cms.contact.phone ? ` أو الهاتف ${cms.contact.phone}` : ''}.`,
    },
  ];

  const sectionsEn = [
    {
      title: 'Introduction',
      body: `This Privacy Policy explains how ${t.brandName} collects, uses and protects your personal information when you use our online store. By using this website, you agree to the practices described below.`,
    },
    {
      title: 'Information we collect',
      body: "We only collect what's needed to fulfill your order and improve our service: your name, mobile number, city and delivery address, and your email if you create an account or sign in with Google. We also keep your order history, cart and wishlist associated with your account for a smoother shopping experience.",
    },
    {
      title: 'How we use your information',
      body: 'Your information is used solely to process and deliver orders, communicate with you about order status, and improve your shopping experience. We do not sell or rent your personal data to any third party for marketing purposes.',
    },
    {
      title: 'Signing in with Google',
      body: "If you choose to sign in with Google, we only receive your name and email address from Google to create your account with us. We never access your Google account password or any other data in your Google account.",
    },
    {
      title: 'Cookies',
      body: 'We use a single essential, HTTP-only cookie to keep you securely signed in. We do not currently use third-party advertising or analytics tracking tools.',
    },
    {
      title: 'Data security',
      body: 'Your data is stored on an encrypted database (Neon PostgreSQL) over a fully encrypted (SSL/TLS) connection, and passwords are stored as irreversible salted hashes, never in plain text.',
    },
    {
      title: 'Payments',
      body: 'The only payment method currently available is cash on delivery. When online payment is enabled in the future, card details will be processed directly by a licensed Saudi payment gateway — this store will never store your card details itself.',
    },
    {
      title: 'Your rights',
      body: 'At any time, you may request access to the data we hold about you, ask us to correct it, or have your account and data deleted entirely. Contact us using the details below to make any of these requests.',
    },
    {
      title: 'Contact us',
      body: `For any question about this policy or your personal data, contact us at ${cms.contact.email || 'the email listed on our site'}${cms.contact.phone ? ` or by phone at ${cms.contact.phone}` : ''}.`,
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
        {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
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

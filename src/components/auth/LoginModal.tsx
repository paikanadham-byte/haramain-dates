import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, ArrowLeft, Phone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { authClient } from '../../lib/neonAuth';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    login,
    register,
    t,
    language,
    dir,
    currentView,
    setCurrentView,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen && currentView !== 'login') return null;

  const close = () => {
    if (currentView === 'login') setCurrentView('store');
    setIsLoginModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) setError(res.message || (language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials'));
      } else {
        const res = await register(email, name, password, phone);
        if (!res.success) setError(res.message || (language === 'ar' ? 'فشل التسجيل، يرجى المحاولة لاحقاً' : 'Registration failed'));
      }
    } catch {
      setError(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleNeonGoogleLogin = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin
      });
    } catch (err) {
      setError(language === 'ar' ? 'فشل الدخول بواسطة Google' : 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        dir={dir}
        className="relative w-full max-w-md bg-white border border-[#DECDBB] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-[#2C180E] via-[#4A2E1A] to-[#2C180E] p-6 text-white text-center relative">
          <button
            onClick={close}
            className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-1 rounded-full text-[#DECDBB] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D8A758]/20 border border-[#D8A758]/40 flex items-center justify-center text-[#D8A758]">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black tracking-tight">
            {mode === 'login'
              ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In to Your Account')
              : (language === 'ar' ? 'إنشاء حساب جديد' : 'Create an Account')}
          </h3>
          <p className="text-xs text-[#DECDBB] mt-1">
            {language === 'ar' ? 'احفظ مفضلاتك وتتبّع طلباتك' : 'Save your favourites and track your orders'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#EFE5D9] bg-[#FAF7F2]">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                mode === m
                  ? 'bg-white text-[#3B2213] border-b-2 border-[#D8A758]'
                  : 'text-[#8C7662] hover:text-[#3B2213]'
              }`}
            >
              {m === 'login'
                ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                : (language === 'ar' ? 'حساب جديد' : 'Sign Up')}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Google Sign-in */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleNeonGoogleLogin}
              disabled={loading}
              className="w-full max-w-[320px] bg-white border border-[#DECDBB] hover:bg-gray-50 text-gray-700 font-medium text-sm py-2 px-4 rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {mode === 'login' 
                ? (language === 'ar' ? 'تسجيل الدخول بواسطة Google' : 'Sign in with Google')
                : (language === 'ar' ? 'التسجيل بواسطة Google' : 'Sign up with Google')}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-[#C5B8A8]">
            <div className="flex-1 h-px bg-[#EFE5D9]" />
            <span className="text-xs">{language === 'ar' ? 'أو بالبريد الإلكتروني' : 'or with email'}</span>
            <div className="flex-1 h-px bg-[#EFE5D9]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: محمد السعيد' : 'e.g. Mohammed Al-Saeed'}
                    className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755]"
                  />
                  <UserIcon className="w-4 h-4 text-[#A66C2E] absolute top-3 start-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755]"
                />
                <Mail className="w-4 h-4 text-[#A66C2E] absolute top-3 start-3" />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                  {language === 'ar' ? 'رقم الجوال (اختياري)' : 'Mobile Number (optional)'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755]"
                  />
                  <Phone className="w-4 h-4 text-[#A66C2E] absolute top-3 start-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
                {mode === 'register' && <span className="text-[#A66C2E] ms-1">{language === 'ar' ? '(١٢ حرف على الأقل)' : '(min 12 chars)'}</span>}
              </label>
              <div className="relative">
                <input
                  type="password"
                  minLength={mode === 'register' ? 12 : undefined}
                  maxLength={256}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755]"
                />
                <Lock className="w-4 h-4 text-[#A66C2E] absolute top-3 start-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3B2213] hover:bg-[#52311C] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>{language === 'ar' ? 'جاري التحقق...' : 'Please wait...'}</span>
              ) : (
                <>
                  <span>{mode === 'login' ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In') : (language === 'ar' ? 'إنشاء الحساب' : 'Create Account')}</span>
                  {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

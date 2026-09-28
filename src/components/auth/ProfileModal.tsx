import React, { useState } from 'react';
import { X, User as UserIcon, Phone, MapPin, Save } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SAUDI_CITIES } from '../../data/initialData';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateProfile, language, dir } = useStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await updateProfile({ name, phone, address, city });
    setLoading(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(
        res.message ||
          (language === 'ar' ? 'تعذر حفظ البيانات.' : 'Unable to save your details.'),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        dir={dir}
        className="relative w-full max-w-md bg-white border border-[#DECDBB] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div className="bg-gradient-to-r from-[#2C180E] via-[#4A2E1A] to-[#2C180E] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-1 rounded-full text-[#DECDBB] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D8A758]/20 border border-[#D8A758]/40 flex items-center justify-center text-[#D8A758]">
            <UserIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black tracking-tight">
            {language === 'ar' ? 'بياناتي الشخصية' : 'My Profile'}
          </h3>
          <p className="text-xs text-[#DECDBB] mt-1">
            {language === 'ar'
              ? 'أضف عنوانك ورقم جوالك لتسريع عمليات الشراء القادمة'
              : 'Add your address and mobile number to speed up future checkouts'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
          {saved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
              {language === 'ar' ? 'تم حفظ بياناتك بنجاح.' : 'Your details were saved.'}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
              {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755]"
              />
              <UserIcon className="w-4 h-4 text-[#A66C2E] absolute top-3 start-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
              {language === 'ar' ? 'رقم الجوال' : 'Mobile Number'}
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755]"
              />
              <Phone className="w-4 h-4 text-[#A66C2E] absolute top-3 start-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
              {language === 'ar' ? 'المدينة' : 'City'}
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755]"
            >
              <option value="">{language === 'ar' ? 'اختر مدينتك' : 'Select your city'}</option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3728] mb-1.5">
              {language === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'}
            </label>
            <div className="relative">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder={
                  language === 'ar'
                    ? 'الحي، الشارع، رقم المبنى، أقرب معلم...'
                    : 'District, street, building number, nearest landmark...'
                }
                className="w-full bg-[#FAF7F2] border border-[#DECDBB] rounded-xl py-2.5 px-3 ps-9 text-xs text-[#3B2213] focus:outline-none focus:border-[#C49755] resize-none"
              />
              <MapPin className="w-4 h-4 text-[#A66C2E] absolute top-3 start-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3B2213] hover:bg-[#52311C] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{language === 'ar' ? 'حفظ البيانات' : 'Save details'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

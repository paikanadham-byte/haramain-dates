import React from 'react';
import { Truck, ShieldCheck, CreditCard, Headphones } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const TrustFeatures: React.FC = () => {
  const { language, t, dir } = useStore();

  const features = [
    {
      icon: Headphones,
      title: t.trustFreshTitle,
      description: t.trustFreshDesc
    },
    {
      icon: CreditCard,
      title: t.trustPaymentTitle,
      description: t.trustPaymentDesc
    },
    {
      icon: ShieldCheck,
      title: t.trustQualityTitle,
      description: t.trustQualityDesc
    },
    {
      icon: Truck,
      title: t.trustFastTitle,
      description: t.trustFastDesc
    }
  ];

  return (
    <section dir={dir} className="border-t border-[#EAE0D3] bg-[#F7F0E6] py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-[#E2D4C3]">
          {features.map((f, index) => {
            const Icon = f.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0"
              >
                <div className="w-13 h-13 rounded-full bg-[#EFE3D3] text-[#A66C2E] flex items-center justify-center mb-3 shadow-2xs">
                  <Icon className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#3B2213] mb-1">
                  {f.title}
                </h4>
                <p className="text-xs text-[#7A6451] max-w-[180px] leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

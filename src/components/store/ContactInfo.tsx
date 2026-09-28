import React from "react";
import { Phone, Mail } from "lucide-react";
import { useStore } from "../../context/StoreContext";

export const ContactInfo: React.FC = () => {
  const { language, dir, cms } = useStore();
  const { phone, email } = cms.contact;

  if (!phone && !email) return null;

  return (
    <section
      dir={dir}
      className="border-t border-[#EAE0D3] bg-[#F7F0E6] py-8"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          {/* Phone */}
          {phone && (
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="flex items-center gap-3 text-[#2C1D11] hover:text-[#C59B58] transition-colors group"
              dir="ltr"
            >
              <div className="w-12 h-12 rounded-full bg-[#EFE3D3] text-[#A66C2E] flex items-center justify-center group-hover:bg-[#D8A758] group-hover:text-white transition-colors shadow-2xs">
                <Phone className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs text-[#7A6451]">
                  {language === "ar" ? "تواصل معنا" : "Contact Us"}
                </p>
                <p className="text-lg font-bold text-[#3B2213]">{phone}</p>
              </div>
            </a>
          )}

          {/* Divider */}
          {phone && email && (
            <div className="hidden md:block w-px h-12 bg-[#D8A758] opacity-50" />
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 text-[#2C1D11] hover:text-[#C59B58] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[#EFE3D3] text-[#A66C2E] flex items-center justify-center group-hover:bg-[#D8A758] group-hover:text-white transition-colors shadow-2xs">
                <Mail className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs text-[#7A6451]">
                  {language === "ar" ? "بريد إلكتروني" : "Email"}
                </p>
                <p className="text-lg font-bold text-[#3B2213]">{email}</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

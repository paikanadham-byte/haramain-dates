import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  Phone,
  Truck,
  Menu,
  X,
  LayoutDashboard,
  Globe,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ChevronDown,
  MapPin,
  Package
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory } from '../../types';
import { ProfileModal } from '../auth/ProfileModal';

export const Header: React.FC = () => {
  const {
    cms,
    cartCount,
    cartSubtotal,
    setIsCartOpen,
    wishlist,
    setWishlistOnly,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    products,
    setQuickViewProduct,
    setCurrentView,
    language,
    setLanguage,
    t,
    dir,
    currentUser,
    isAuthenticated,
    isAdmin,
    setIsLoginModalOpen,
    logout
  } = useStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktopSearch = searchContainerRef.current?.contains(target);
      const insideMobileSearch = mobileSearchContainerRef.current?.contains(target);
      if (!insideDesktopSearch && !insideMobileSearch) {
        setIsSearchFocused(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? products
        .filter(
          p =>
            !p.isHidden &&
            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.descriptionEn && p.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
              p.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.originEn && p.originEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
              p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const searchDropdown = isSearchFocused && searchQuery.trim() ? (
    <div className="absolute top-full mt-2 w-full bg-white border border-[#E3D6C8] rounded-xl shadow-xl z-50 overflow-hidden text-start">
      <div className="p-2 border-b border-[#F0E6DA] bg-[#FAF7F2] text-xs font-medium text-[#7C5A3E] flex justify-between items-center">
        <span>{t.searchResults} "{searchQuery}"</span>
        <span>{searchResults.length} {language === 'ar' ? 'منتجات' : 'items'}</span>
      </div>
      {searchResults.length > 0 ? (
        <div className="divide-y divide-[#F5EFE7] max-h-80 overflow-y-auto">
          {searchResults.map(prod => (
            <div
              key={prod.id}
              onClick={() => {
                setQuickViewProduct(prod);
                setIsSearchFocused(false);
              }}
              className="flex items-center gap-3 p-3 hover:bg-[#FDF9F3] cursor-pointer transition-colors"
            >
              <img
                src={prod.images[0]}
                alt={language === 'ar' ? prod.name : prod.nameEn}
                className="w-12 h-12 rounded-lg object-cover border border-[#EADFCF]"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#2C1D11] truncate">
                  {language === 'ar' ? prod.name : prod.nameEn}
                </h4>
                <p className="text-xs text-[#8F7967]">
                  {(language === 'ar' ? prod.weight : prod.weightEn || prod.weight)} • {(language === 'ar' ? prod.origin : prod.originEn || prod.origin)}
                </p>
              </div>
              <div className="text-end">
                <span className="text-sm font-bold text-[#A66C2E]">
                  {prod.salePrice ?? prod.price} {t.sar}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-[#8F7967]">
          {t.noResults}
        </div>
      )}
    </div>
  ) : null;

  const navItems: { label: string; category: ProductCategory | 'all' }[] = [
    { label: t.navHome, category: 'all' },
    { label: t.navDates, category: 'dates' },
    { label: t.navMaamoul, category: 'maamoul' },
    { label: t.navNuts, category: 'nuts' },
    { label: t.navSweets, category: 'sweets' },
    { label: t.navOffers, category: 'offers' }
  ];

  return (
    <>
    <header dir={dir} className="w-full bg-[#FAF7F2] sticky top-0 z-40 shadow-xs">
      {/* 1. Top Announcement & Utility Bar */}
      {cms.announcementEnabled && (
        <div className="bg-[#2E1A10] text-[#E7D6BE] text-xs py-2 px-4 border-b border-[#4A2D1B]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            {/* Announcement Message */}
            <div className="flex items-center gap-2 text-start">
              <Truck className="w-4 h-4 text-[#D8A758] shrink-0" />
              <span className="font-medium tracking-wide">
                {language === 'ar' ? cms.announcementText : (cms.announcementTextEn || cms.announcementText)}
              </span>
            </div>

            {/* Quick Links & Language Toggle */}
            <div className="flex items-center gap-3 text-xs">
              {/* Order Tracking Quick Link */}
              <button
                onClick={() => setCurrentView('track-order')}
                className="flex items-center gap-1.5 text-[#E7D6BE] hover:text-[#D8A758] transition-colors cursor-pointer"
                title={language === 'ar' ? 'تتبع طلبك' : 'Track Order'}
              >
                <Package className="w-3.5 h-3.5 text-[#D8A758]" />
                <span className="font-semibold">{language === 'ar' ? 'تتبع طلبك' : 'Track Order'}</span>
              </button>

              <span className="text-[#5C3A24]">|</span>

              {/* Language Switcher Button */}
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#422616] hover:bg-[#59351F] text-[#F0E6D8] hover:text-[#D8A758] transition-colors border border-[#633B21] cursor-pointer"
                title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
              >
                <Globe className="w-3.5 h-3.5 text-[#D8A758]" />
                <span className="font-bold">{language === 'ar' ? 'English' : 'عربي'}</span>
              </button>

              <span className="text-[#5C3A24]">|</span>

              <a
                href={cms.social.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#D8A758] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#D8A758]" />
                <span className="hidden sm:inline">{t.contactUs}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Middle Brand & Utility Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-1 sm:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#3E2415] hover:bg-[#F0E6D8] cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Search Box (Desktop) */}
          <div ref={searchContainerRef} className="hidden md:block relative w-72 lg:w-96">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-white border border-[#DECDBB] focus:border-[#C49755] rounded-full py-2.5 px-10 text-sm text-[#2C1D11] placeholder-[#8F7967] focus:outline-hidden focus:ring-2 focus:ring-[#C49755]/20 transition-all shadow-2xs text-start"
              />
              <Search className="w-4 h-4 text-[#8F7967] absolute start-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 text-[#A89381] hover:text-[#2C1D11] text-xs p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Autocomplete Dropdown */}
            {searchDropdown}
          </div>

          {/* Center Brand Logo */}
          <div
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setWishlistOnly(false);
              setCurrentView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center cursor-pointer group select-none"
          >
            <div className="flex items-center gap-2">
              <img
                src="/images/logo.png"
                alt={t.brandName}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-contain group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="text-center">
                <h1 className="text-sm sm:text-2xl font-bold text-[#3B2213] tracking-tight flex items-center justify-center gap-1.5">
                  <span>{t.brandName}</span>
                </h1>
                <p className="block text-[9px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.25em] text-[#A6783B] uppercase">
                  TMOOR ALHARMAIN
                </p>
                <div className="hidden sm:flex items-center justify-center gap-1 mt-0.5">
                  <div className="w-5 h-[1px] bg-[#D8A758]/60"></div>
                  <span className="text-[9px] text-[#8C6D4F]">
                    {language === 'ar' ? 'من أرض الحرمين .. إلى كل مكان' : 'From The Holy Lands .. To The World'}
                  </span>
                  <div className="w-5 h-[1px] bg-[#D8A758]/60"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Language, Wishlist, Cart Drawer */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} aria-label={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'} className="p-1.5 text-xs font-bold rounded-lg hover:bg-[#F0E6D8]">{language === 'ar' ? 'EN' : 'عربي'}</button>

            {/* Order Tracking button */}
            <button
              onClick={() => setCurrentView('track-order')}
              className="p-1.5 sm:p-2 rounded-full text-[#3E2415] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
              title={language === 'ar' ? 'تتبع طلبك' : 'Track Order'}
              aria-label={language === 'ar' ? 'تتبع طلبك' : 'Track Order'}
            >
              <Package className="w-5 h-5" />
            </button>

            {/* Wishlist button */}
            <button
              onClick={() => {
                setWishlistOnly(true); setCurrentView('store'); setSelectedCategory('all'); setSearchQuery('');
                const el = document.getElementById('products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative p-1.5 sm:p-2 rounded-full text-[#3E2415] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
              title={t.wishlist}
              aria-label={t.wishlist}
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D8A758] text-[#2C1D11] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Login / User Status */}
            {isAuthenticated ? (
              <div ref={userDropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-full text-[#3E2415] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                  aria-label={currentUser?.name}
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="hidden sm:inline max-w-[90px] truncate text-sm font-bold">{currentUser?.name}</span>
                  <ChevronDown className="hidden sm:inline w-3.5 h-3.5" />
                </button>

                {userDropdownOpen && (
                  <div className={`absolute top-full ${dir === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-48 bg-white border border-[#E8DDD0] rounded-xl shadow-xl py-1 text-[#3B2213] text-start z-50 animate-in fade-in zoom-in-95`}>
                    <div className="px-3 py-2 border-b border-[#F0E6D8] bg-[#FAF7F2]">
                      <p className="text-xs font-bold text-[#3B2213]">{currentUser?.name}</p>
                      <p className="text-[10px] text-[#8C7662] truncate font-mono">{currentUser?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#3B2213] hover:bg-[#FAF7F2] hover:text-[#A66C2E] cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-[#D8A758]" />
                      <span>
                        {currentUser?.address
                          ? (language === 'ar' ? 'بياناتي الشخصية' : 'My Profile')
                          : (language === 'ar' ? 'أضف عنوانك ورقم جوالك' : 'Add address & phone')}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView('track-order');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#3B2213] hover:bg-[#FAF7F2] hover:text-[#A66C2E] cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-[#D8A758]" />
                      <span>{language === 'ar' ? 'تتبع طلباتي' : 'Track My Orders'}</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#3B2213] hover:bg-[#FAF7F2] hover:text-[#A66C2E] cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#D8A758]" />
                        <span>{t.adminDashboard}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-full text-[#3E2415] hover:bg-[#F0E6D8] transition-colors cursor-pointer"
                title={t.login}
                aria-label={t.login}
              >
                <UserIcon className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-bold">{t.login}</span>
              </button>
            )}

            {/* Shopping Cart Drawer Toggle */}
            <button
              aria-label={t.cartTitle}
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 bg-[#3B2213] hover:bg-[#4F2F1B] text-white px-3 sm:px-4 py-2 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#D8A758]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -start-1.5 bg-[#D8A758] text-[#2C1D11] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-start leading-tight">
                <span className="text-[10px] text-[#E0D0BE]">{t.cartTitle}</span>
                <span className="text-xs font-bold text-[#F3ECE2]">{cartSubtotal.toFixed(2)} {t.sar}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div ref={mobileSearchContainerRef} className="md:hidden mt-3 relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-white border border-[#DECDBB] focus:border-[#C49755] rounded-full py-2 px-10 text-xs text-[#2C1D11] placeholder-[#8F7967] focus:outline-hidden text-start"
            />
            <Search className="w-4 h-4 text-[#8F7967] absolute start-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 text-[#A89381] hover:text-[#2C1D11] text-xs p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Search Autocomplete Dropdown */}
          {searchDropdown}
        </div>
      </div>

      {/* 3. Main Navigation Bar */}
      <nav className="bg-[#3D2314] text-[#EAE0D3] border-y border-[#573520] shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="hidden md:flex items-center justify-center gap-1 sm:gap-4 lg:gap-8 text-sm font-medium py-2.5">
            {navItems.map(item => {
              const isActive = selectedCategory === item.category;
              return (
                <button
                  key={item.category}
                  onClick={() => {
                    setSelectedCategory(item.category);
                    setSearchQuery('');
                    setWishlistOnly(false);
                    setCurrentView('store');
                    const el = document.getElementById('products-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-3 py-1 rounded-full text-xs lg:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#D8A758] text-[#2C180E] shadow-sm font-black'
                      : 'hover:text-[#D8A758] hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile slide menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#573520] bg-[#331D10] p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => {
                  setLanguage(language === 'ar' ? 'en' : 'ar');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[#442716] text-[#D8A758] text-xs font-bold"
              >
                <Globe className="w-4 h-4" />
                <span>{language === 'ar' ? 'English' : 'عربي'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setCurrentView('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-3 text-xs font-bold text-[#D8A758] hover:bg-[#FAF7F2] rounded-xl cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t.adminDashboard}</span>
                </button>
              )}
            </div>

            {/* Mobile Track Order Button */}
            <button
              onClick={() => {
                setCurrentView('track-order');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#442716] border border-[#5A3822] text-[#D8A758] text-xs font-bold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#D8A758]" />
                <span>{language === 'ar' ? 'تتبع مسار شحنتك وطلبك' : 'Track Your Order & Shipment'}</span>
              </div>
              <span className="text-[10px] bg-[#D8A758]/20 px-2 py-0.5 rounded-full text-[#FDEBD0]">
                {language === 'ar' ? 'مباشر' : 'Live'}
              </span>
            </button>

            {navItems.map(item => (
              <button
                key={item.category}
                onClick={() => {
                  setSelectedCategory(item.category);
                  setSearchQuery('');
                  setWishlistOnly(false);
                  setCurrentView('store');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-start p-2.5 rounded-lg text-xs font-bold ${
                  selectedCategory === item.category
                    ? 'bg-[#D8A758] text-[#2C180E]'
                    : 'text-[#EAE0D3] hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </header>
    {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}
    </>
  );
};

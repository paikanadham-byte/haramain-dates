import React, { Suspense, lazy, useEffect, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { authClient } from './lib/neonAuth';
import { Header } from './components/store/Header';
import { HeroBanner } from './components/store/HeroBanner';
import { CategoryShowcase } from './components/store/CategoryShowcase';
import { ProductGrid } from './components/store/ProductGrid';
import { HeritagePromoBanner } from './components/store/HeritagePromoBanner';
import { TrustFeatures } from './components/store/TrustFeatures';
import { ContactInfo } from './components/store/ContactInfo';
import { Footer } from './components/store/Footer';
import { CartDrawer } from './components/store/CartDrawer';
import { ProductDetailModal } from './components/store/ProductDetailModal';
import { CheckoutView } from './components/store/CheckoutView';
import { OrderSuccessView } from './components/store/OrderSuccessView';
import { ChatWidget } from './components/store/ChatWidget';
import { PrivacyPolicyPage } from './components/store/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/store/TermsOfServicePage';
import { RefundPolicyPage } from './components/store/RefundPolicyPage';
import { OrderTrackingView } from './components/store/OrderTrackingView';
import { LoginModal } from './components/auth/LoginModal';
// Lazy-loaded: the admin dashboard is ~1600 lines that only the store owner ever
// needs, but it was being bundled into the same chunk every customer downloads
// before seeing a single product. This keeps it out of the initial page load.
const AdminLayout = lazy(() =>
  import('./components/admin/ManageDashboard').then((m) => ({ default: m.ManageDashboard })),
);

const StoreContent: React.FC = () => {
  const { currentView, isBackendConnected, refreshBackendData, language, syncNeonAuth, isAuthenticated } = useStore();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const checkNeonSession = async () => {
      try {
        const hasNeonAuth = Boolean(import.meta.env.VITE_NEON_AUTH_BASE_URL || (import.meta.env as Record<string, string | undefined>).NEON_AUTH_BASE_URL);
        if (hasNeonAuth) {
          const sessionPromise = authClient.getSession();
          const timeoutPromise = new Promise<{ data: null }>((resolve) =>
            setTimeout(() => resolve({ data: null }), 2000),
          );
          const res = await Promise.race([sessionPromise, timeoutPromise]);
          const sessionData = (res as { data?: { user?: { name: string; email: string } } })?.data;
          if (sessionData?.user && !isAuthenticated) {
            await syncNeonAuth({
              name: sessionData.user.name,
              email: sessionData.user.email,
            });
          }
        }
      } catch (err) {
        // ignore session errors
      } finally {
        setSyncing(false);
      }
    };
    checkNeonSession();
  }, [isAuthenticated, syncNeonAuth]);

  // Scroll to top on every view transition except when returning to the
  // store homepage — there the user normally wants to land back where they
  // were (e.g. after closing a product modal).
  useEffect(() => {
    if (currentView !== 'store') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentView]);

  if (syncing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="animate-spin w-8 h-8 border-4 border-[#C59B58] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Admin dashboard — completely separate, no customer login modal shown here
  if (currentView === 'admin') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
            <div className="animate-spin w-8 h-8 border-4 border-[#C59B58] border-t-transparent rounded-full" />
          </div>
        }
      >
        <AdminLayout />
      </Suspense>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <LoginModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C1D11] selection:bg-[#D8A758]/30 selection:text-[#2C180E]">
      <Header />
      {!isBackendConnected && <div role="alert" className="bg-amber-50 p-3 text-center text-sm text-amber-900">{language === 'ar' ? 'تعذر الاتصال بالمتجر. يرجى إعادة المحاولة قبل إتمام الطلب.' : 'Unable to connect to the store. Please retry before placing an order.'} <button className="underline font-bold ms-2" onClick={refreshBackendData}>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>}

      <main className="flex-1">
        {currentView === 'store' && (
          <>
            <HeroBanner />
            <CategoryShowcase />
            <ProductGrid />
            <HeritagePromoBanner />
            <TrustFeatures />
            <ContactInfo />
          </>
        )}

        {currentView === 'checkout' && <CheckoutView />}

        {currentView === 'order-success' && <OrderSuccessView />}

        {currentView === 'track-order' && <OrderTrackingView />}

        {currentView === 'privacy' && <PrivacyPolicyPage />}

        {currentView === 'terms' && <TermsOfServicePage />}

        {currentView === 'refund' && <RefundPolicyPage />}
      </main>

      <Footer />
      <CartDrawer />
      <ProductDetailModal />
      <ChatWidget />
      <LoginModal />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StoreContent />
    </StoreProvider>
  );
}

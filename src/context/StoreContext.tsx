import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Product,
  CartItem,
  Order,
  Coupon,
  CMSContent,
  ShippingCarrierOption,
  OrderStatus,
  ProductCategory,
  Language,
  User,
} from "../types";
import {
  INITIAL_PRODUCTS,
  INITIAL_CMS,
  INITIAL_SHIPPING_OPTIONS,
} from "../data/initialData";
import { translations } from "../utils/translations";
import { authClient } from "../lib/neonAuth";

interface StoreContextType {
  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.ar;
  dir: "rtl" | "ltr";

  // Navigation & View
  currentView:
    | "store"
    | "admin"
    | "checkout"
    | "order-success"
    | "login"
    | "privacy"
    | "terms"
    | "refund"
    | "track-order";
  setCurrentView: (
    view:
      | "store"
      | "admin"
      | "checkout"
      | "order-success"
      | "login"
      | "privacy"
      | "terms"
      | "refund"
      | "track-order",
  ) => void;
  trackingOrderId: string | null;
  setTrackingOrderId: (id: string | null) => void;
  openOrderTracking: (id?: string) => void;
  selectedCategory: ProductCategory | "all";
  setSelectedCategory: (category: ProductCategory | "all") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;

  // Auth & User
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (
    email: string,
    password?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    email: string,
    name: string,
    password?: string,
    phone?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  syncNeonAuth: (user: { name: string, email: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  customers: User[];
  fetchCustomers: () => Promise<void>;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductHidden: (id: string) => void;
  updateStock: (id: string, stock: number) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, packSize?: import('../types').PackSizeOption) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Wishlist
  wishlistOnly: boolean;
  setWishlistOnly: (value: boolean) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  // Coupons
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  addCoupon: (coupon: Omit<Coupon, "id">) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  // Orders
  orders: Order[];
  placeOrder: (
    orderData: Omit<Order, "id" | "createdAt" | "taxAmount">,
  ) => Promise<Order>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string,
  ) => void;
  refundOrder: (orderId: string, reason: string, restock?: boolean) => void;
  unreadOrdersCount: number;
  markOrdersRead: () => void;
  notificationAlert: string | null;
  clearNotificationAlert: () => void;
  lastCompletedOrder: Order | null;
  setLastCompletedOrder: (order: Order | null) => void;

  // Shipping
  shippingOptions: ShippingCarrierOption[];
  updateShippingOption: (
    id: string,
    updates: Partial<ShippingCarrierOption>,
  ) => void;

  // CMS
  cms: CMSContent;
  updateCMS: (updates: Partial<CMSContent>) => void;

  // Backend Health & Diagnostics
  isBackendConnected: boolean;
  refreshBackendData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Language State
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("hrm_lang");
      return (saved === "en" ? "en" : "ar") as Language;
    } catch {
      return "ar";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("hrm_lang", lang);
    } catch {
      /* Language still switches in memory. */
    }
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.title =
      language === "ar"
        ? "تمور الحرمين | تمور وضيافة سعودية"
        : "Tmoor Alharmain | Saudi Dates & Hospitality";
    const description = document.querySelector("meta[name=description]");
    description?.setAttribute(
      "content",
      language === "ar"
        ? "تسوق التمور السعودية والمعمول والكليجا والمكسرات من تمور الحرمين."
        : "Shop Saudi dates, maamoul, kleija and nuts from Tmoor Alharmain.",
    );
  }, [language]);

  const dir = language === "ar" ? "rtl" : "ltr";
  const t = translations[language];

  // Navigation State
  type View =
    | "store"
    | "admin"
    | "checkout"
    | "order-success"
    | "login"
    | "privacy"
    | "terms"
    | "refund"
    | "track-order";
  const routeView = (): View => {
    const route = window.location.pathname.replace(/\/$/, "");
    return route === "/admin"
      ? "admin"
      : route === "/login"
        ? "login"
        : route === "/checkout"
          ? "checkout"
          : route === "/order-success"
            ? "order-success"
            : route === "/privacy"
              ? "privacy"
              : route === "/terms"
                ? "terms"
                : route === "/refund"
                  ? "refund"
                  : route === "/track-order" || route === "/track"
                    ? "track-order"
                    : "store";
  };
  const [currentView, setCurrentViewState] = useState<View>(routeView);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("id") || params.get("orderId") || null;
    } catch {
      return null;
    }
  });

  const openOrderTracking = (id?: string) => {
    if (id) setTrackingOrderId(id);
    setCurrentView("track-order");
  };

  const setCurrentView = (view: View) => {
    const route = view === "store" ? "/" : `/${view}`;
    if (window.location.pathname !== route)
      window.history.pushState({}, "", route);
    setCurrentViewState(view);
  };
  useEffect(() => {
    const onBack = () => {
      setCurrentViewState(routeView());
      setIsCartOpen(false);
      setQuickViewProduct(null);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(
    null,
  );

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === "admin";

  // Backend connection status
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Core Persistent State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const restoredCart = useRef<Array<{
    productId: string;
    quantity: number;
    selectedWeight?: string;
  }> | null>(null);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hrm_cart") || "[]");
      restoredCart.current = Array.isArray(saved)
        ? saved.filter(
            (i) =>
              i &&
              typeof i.productId === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0,
          )
        : [];
    } catch {
      restoredCart.current = [];
    }
  }, []);

  const [wishlistOnly, setWishlistOnly] = useState(false);
  const checkoutAttempt = useRef<{ payload: string; key: string } | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("hrm_wishlist");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);

  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [customers, setCustomers] = useState<User[]>([]);

  const [cms, setCMS] = useState<CMSContent>(INITIAL_CMS);

  useEffect(() => {
    if (!cms.seo) return;
    document.title =
      language === "ar"
        ? cms.seo.metaTitle
        : cms.seo.metaTitleEn || "Tmoor Alharmain";
    const description =
      language === "ar"
        ? cms.seo.metaDescription
        : cms.seo.metaDescriptionEn || "Saudi dates and hospitality";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
  }, [cms.seo, language]);

  const [shippingOptions, setShippingOptions] = useState<
    ShippingCarrierOption[]
  >(INITIAL_SHIPPING_OPTIONS);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [notificationAlert, setNotificationAlert] = useState<string | null>(
    null,
  );

  // Sync to localStorage

  useEffect(() => {
    if (!cartHydrated) return;
    try {
      localStorage.setItem(
        "hrm_cart",
        JSON.stringify(
          cart.map(({ productId, quantity, selectedWeight }) => ({
            productId,
            quantity,
            selectedWeight,
          })),
        ),
      );
    } catch {
      /* Shopping remains usable if browser storage is unavailable. */
    }
  }, [cart, cartHydrated]);

  useEffect(() => {
    try {
      localStorage.setItem("hrm_wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Wishlist toggles are deliberate, infrequent clicks (unlike cart quantity, which
  // can change rapidly), so this saves almost immediately -- just enough debounce to
  // coalesce an accidental double-click, not so much that a quick page refresh loses
  // the like before it's ever persisted.
  useEffect(() => {
    if (!currentUser) return;
    const timeout = setTimeout(() => {
      fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: wishlist }),
      }).catch(console.error);
    }, 300);
    return () => clearTimeout(timeout);
  }, [wishlist, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const timeout = setTimeout(() => {
      fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      }).catch(console.error);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [cart, currentUser]);

  const api = React.useCallback(
    async (
      url: string,
      method = "GET",
      body?: unknown,
      headers: Record<string, string> = {},
    ) => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    },
    [],
  );
  const reportError = (error: unknown) => {
    setNotificationAlert(
      language === "ar"
        ? "تعذر حفظ التغييرات. تحقق من البيانات والاتصال ثم حاول مجدداً."
        : `Changes were not saved. ${error instanceof Error ? error.message : "Please try again."}`,
    );
  };
  const refreshBackendData = React.useCallback(async () => {
    try {
      const [p, m, sh, auth] = await Promise.all([
        api("/api/products"),
        api("/api/cms"),
        api("/api/shipping"),
        api("/api/auth/me"),
      ]);
      setProducts(p.products);
      const savedCart = restoredCart.current;
      restoredCart.current = null;
      setCart((previous) =>
        (savedCart ?? previous).flatMap((item) => {
          const product = p.products.find(
            (p: Product) =>
              p.id === item.productId && !p.isHidden && p.stock > 0,
          );
          return product && Number.isInteger(item.quantity) && item.quantity > 0
            ? [
                {
                  ...item,
                  selectedWeight: product.weight,
                  product,
                  quantity: Math.min(item.quantity, product.stock),
                },
              ]
            : [];
        }),
      );
      setCartHydrated(true);
      if (auth.user?.role === "admin")
        setCoupons((await api("/api/coupons")).coupons);
      else setCoupons([]);
      setCMS(m.cms);
      setShippingOptions(sh.shippingOptions);
      setCurrentUser(auth.user);
      if (auth.user?.favorites) {
        // Drop any favorite referencing a product that no longer exists (e.g. a
        // deleted test product) -- otherwise the wishlist count/badge stays
        // inflated forever and the wishlist-only view can look broken.
        const validIds = new Set(p.products.map((prod: Product) => prod.id));
        const cleaned = auth.user.favorites.filter((id: string) => validIds.has(id));
        setWishlist(cleaned);
      }
      if (auth.user?.role === "admin") {
        const data = await api("/api/orders");
        setOrders(data.orders);
        setUnreadOrdersCount(
          data.orders.filter((o: Order) => o.orderStatus === "new").length,
        );
      } else setOrders([]);
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  }, [api]);
  useEffect(() => {
    [
      "hrm_orders",
      "hrm_products",
      "hrm_cms",
      "hrm_shipping",
      "hrm_coupons",
      "hrm_user",
    ].forEach((k) => localStorage.removeItem(k));
    refreshBackendData();
  }, []);
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(() => {
      api("/api/orders")
        .then((data) => {
          setOrders(data.orders);
          setUnreadOrdersCount(
            data.orders.filter((o: Order) => o.orderStatus === "new").length,
          );
        })
        .catch(() => setIsBackendConnected(false));
    }, 15000);
    return () => clearInterval(timer);
  }, [isAdmin]);
  const login = async (email: string, password?: string) => {
    try {
      const data = await api("/api/auth/login", "POST", { email, password });
      setCurrentUser(data.user);
      if (data.user?.favorites) setWishlist(data.user.favorites);
      setIsLoginModalOpen(false);
      await refreshBackendData();
      return { success: true };
    } catch {
      return {
        success: false,
        message:
          language === "ar"
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة، أو تعذر الاتصال."
            : "Invalid email or password, or service unavailable.",
      };
    }
  };
  const register = async (
    email: string,
    name: string,
    password?: string,
    phone?: string,
  ) => {
    try {
      const data = await api("/api/auth/register", "POST", {
        email,
        name,
        password,
        phone,
      });
      setCurrentUser(data.user);
      if (data.user?.favorites) setWishlist(data.user.favorites);
      setIsLoginModalOpen(false);
      return { success: true };
    } catch {
      return {
        success: false,
        message:
          language === "ar"
            ? "تحقق من البريد وكلمة المرور (١٢ حرفاً على الأقل)."
            : "Check email and password (at least 12 characters).",
      };
    }
  };
  const syncNeonAuth = React.useCallback(
    async (neonUser: { name: string; email: string }) => {
      try {
        const data = await api("/api/auth/neon-sync", "POST", neonUser);
        setCurrentUser(data.user);
        if (data.user?.favorites) setWishlist(data.user.favorites);
        setIsLoginModalOpen(false);
        await refreshBackendData();
      } catch (err) {
        console.error("Neon auth sync failed:", err);
      }
    },
    [api, refreshBackendData],
  );
  const logout = async () => {
    // End the Google/Neon Auth session FIRST and wait for it -- if our own
    // session is cleared first, isAuthenticated flips to false immediately and
    // App.tsx's session-check effect re-fires; if the Google session is still
    // alive at that exact moment, it signs the user straight back in before
    // they ever see a login screen.
    try {
      await authClient.signOut();
    } catch {
      /* Best-effort -- still proceed to clear our own session below. */
    }
    setWishlistOnly(false);
    try {
      await api("/api/auth/logout", "POST");
    } catch (error) {
      reportError(error);
    }
    setCurrentUser(null);
    setWishlist([]);
    setOrders([]);
    setCurrentView("store");
    localStorage.removeItem("hrm_user");
    await refreshBackendData();
  };
  const updateProfile = async (updates: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  }) => {
    try {
      const data = await api("/api/auth/me", "PUT", updates);
      setCurrentUser(data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : language === "ar"
              ? "تعذر حفظ البيانات."
              : "Unable to save your details.",
      };
    }
  };
  const fetchCustomers = React.useCallback(async () => {
    try {
      const data = await api("/api/users");
      setCustomers(data.users);
    } catch {
      /* Admin-only list; silently skip if unavailable. */
    }
  }, [api]);
  const addProduct = async (product: Omit<Product, "id">): Promise<Product> => {
    const data = await api("/api/products", "POST", product);
    setProducts((prev) => [data.product, ...prev]);
    return data.product;
  };
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const data = await api(`/api/products/${id}`, "PUT", updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)));
    } catch (e) {
      reportError(e);
      throw e;
    }
  };
  const deleteProduct = async (id: string) => {
    try {
      await api(`/api/products/${id}`, "DELETE");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      reportError(e);
    }
  };
  const toggleProductHidden = (id: string) => {
    const p = products.find((p) => p.id === id);
    if (p) updateProduct(id, { isHidden: !p.isHidden }).catch(() => {});
  };
  const updateStock = (id: string, stock: number) => {
    updateProduct(id, { stock }).catch(() => {});
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, packSize?: import('../types').PackSizeOption) => {
    if (
      product.stock <= 0 ||
      product.isHidden ||
      !Number.isInteger(quantity) ||
      quantity < 1
    )
      return;

    setCart((prev) => {
      // Use pack label as part of key so each pack size is a separate cart line
      const packKey = packSize ? `${packSize.label}` : '';
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && (item.selectedPackSize?.label ?? '') === packKey,
      );
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(product.stock, currentQty + quantity);
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            product,
            quantity: Math.min(product.stock, quantity),
            selectedWeight: packSize ? (packSize.label || product.weight) : product.weight,
            selectedPackSize: packSize,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const maxStock = item.product.stock;
          return {
            ...item,
            quantity: Math.min(maxStock, quantity),
          };
        }
        return item;
      }),
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartSubtotal = cart.reduce((total, item) => {
    const unitPrice = item.product.salePrice ?? item.product.price;
    return total + unitPrice * item.quantity;
  }, 0);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // Coupons
  const discountAmount = React.useMemo(() => {
    if (
      !appliedCoupon ||
      !appliedCoupon.isActive ||
      Date.parse(appliedCoupon.expiresAt + "T23:59:59Z") < Date.now()
    )
      return 0;
    if (cartSubtotal < appliedCoupon.minOrderValue) return 0;
    if (appliedCoupon.discountType === "percentage") {
      return Number(
        ((cartSubtotal * appliedCoupon.discountValue) / 100).toFixed(2),
      );
    } else {
      return Math.min(cartSubtotal, appliedCoupon.discountValue);
    }
  }, [appliedCoupon, cartSubtotal]);

  const applyCoupon = async (code: string) => {
    try {
      const { coupon } = await api("/api/coupons/validate", "POST", {
        code,
        subtotal: cartSubtotal,
      });
      setAppliedCoupon(coupon);
      return {
        success: true,
        message:
          language === "ar"
            ? "تم تطبيق كود الخصم بنجاح"
            : "Coupon applied successfully",
      };
    } catch {
      return {
        success: false,
        message:
          language === "ar"
            ? "تعذر تطبيق الكوبون. تحقق من الكود وصلاحيته والحد الأدنى للطلب والاتصال."
            : "Unable to apply coupon. Check the code, expiry, minimum order and connection.",
      };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const addCoupon = (coupon: Omit<Coupon, "id">) => {
    api("/api/coupons", "POST", coupon)
      .then((data) => setCoupons((prev) => [data.coupon, ...prev]))
      .catch(reportError);
  };
  const updateCoupon = (id: string, updates: Partial<Coupon>) => {
    api(`/api/coupons/${id}`, "PUT", updates)
      .then((data) =>
        setCoupons((prev) => prev.map((c) => (c.id === id ? data.coupon : c))),
      )
      .catch(reportError);
  };
  const deleteCoupon = (id: string) => {
    api(`/api/coupons/${id}`, "DELETE")
      .then(() => setCoupons((prev) => prev.filter((c) => c.id !== id)))
      .catch(reportError);
  };
  const placeOrder = async (
    orderData: Omit<Order, "id" | "createdAt" | "taxAmount">,
  ): Promise<Order> => {
    const payload = JSON.stringify(orderData);
    if (checkoutAttempt.current?.payload !== payload)
      checkoutAttempt.current = { payload, key: crypto.randomUUID() };
    const { order } = await api("/api/orders", "POST", orderData, {
      "Idempotency-Key": checkoutAttempt.current.key,
    });
    checkoutAttempt.current = null;
    setLastCompletedOrder(order);
    clearCart();
    await refreshBackendData();
    return order;
  };
  const updateOrderStatus = (
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
  ) => {
    api(`/api/orders/${id}/status`, "PUT", { status, trackingNumber })
      .then(refreshBackendData)
      .catch(reportError);
  };
  const refundOrder = (id: string, reason: string, restock = true) => {
    api(`/api/orders/${id}/refund`, "POST", { reason, restock })
      .then(refreshBackendData)
      .catch(reportError);
  };

  const markOrdersRead = () => {
    setUnreadOrdersCount(0);
  };

  const clearNotificationAlert = () => {
    setNotificationAlert(null);
  };

  const updateCMS = (updates: Partial<CMSContent>) => {
    api("/api/cms", "PUT", updates)
      .then((data) => setCMS(data.cms))
      .catch(reportError);
  };
  const updateShippingOption = (
    id: string,
    updates: Partial<ShippingCarrierOption>,
  ) => {
    api(`/api/shipping/${id}`, "PUT", updates)
      .then(refreshBackendData)
      .catch(reportError);
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        currentView,
        setCurrentView,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        quickViewProduct,
        setQuickViewProduct,
        currentUser,
        
        
        isAuthenticated,
        isAdmin,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        register,
        syncNeonAuth,
        logout,
        updateProfile,
        customers,
        fetchCustomers,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductHidden,
        updateStock,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        wishlistOnly,
        setWishlistOnly,
        wishlist,
        toggleWishlist,
        coupons,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        orders,
        placeOrder,
        updateOrderStatus,
        refundOrder,
        unreadOrdersCount,
        markOrdersRead,
        notificationAlert,
        clearNotificationAlert,
        lastCompletedOrder,
        setLastCompletedOrder,
        trackingOrderId,
        setTrackingOrderId,
        openOrderTracking,
        shippingOptions,
        updateShippingOption,
        cms,
        updateCMS,
        isBackendConnected,
        refreshBackendData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

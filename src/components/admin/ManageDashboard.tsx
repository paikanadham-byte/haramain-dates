import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bot,
  Box,
  Check,
  Download,
  Globe,
  Hash,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Phone,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Tag,
  Truck,
  Users,
  Weight,
  X,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { SAUDI_CITIES } from "../../data/initialData";
import { CITY_NAMES_EN } from "../../utils/cities";
import type { Product } from "../../types";

const categories = ["dates", "maamoul", "kleija", "gifts", "popular_sweets", "haramain_packages", "events", "offers"];
const categoryAr = [
  "التمور",
  "المعمول",
  "الكليجا",
  "الباقات والهدايا",
  "الحلويات الشعبية",
  "بكجات تمور الحرمين",
  "ضيافة الأفراح والمناسبات",
  "العروض",
];
const statuses = ["new", "processing", "shipped", "delivered", "cancelled"];
const statusAr = ["جديد", "قيد التجهيز", "تم الشحن", "تم التسليم", "ملغي"];
const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B2213] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50";
// Vercel serverless functions reject any request body over ~4.5MB before it
// ever reaches this app's own code -- that limit can't be raised from here.
// Stay comfortably under it so combined image uploads (several photos in one
// save) don't get silently rejected by the platform.
const MAX_REQUEST_BYTES = 4_000_000;
const TOO_LARGE_MESSAGE =
  "Your photos are too large combined for one save. Use smaller or fewer images and try again. / " +
  "حجم الصور كبير جداً مجتمعة لحفظها دفعة واحدة. استخدم صوراً أصغر أو أقل ثم حاول مرة أخرى.";
async function request(url: string, method = "GET", body?: unknown) {
  if (body !== undefined) {
    const size = new Blob([JSON.stringify(body)]).size;
    if (size > MAX_REQUEST_BYTES) throw new Error(TOO_LARGE_MESSAGE);
  }
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (res.status === 413) {
      message = TOO_LARGE_MESSAGE;
    } else {
      try {
        const data = await res.json();
        message = data.error || message;
      } catch {
        // Response wasn't JSON (e.g. a platform error page) -- keep the generic message above.
      }
    }
    throw new Error(message);
  }
  return res.json();
}
export function ManageDashboard() {
  const store = useStore();
  const {
    language,
    setLanguage,
    dir,
    isAdmin,
    login,
    logout,
    products,
    orders,
    coupons,
    cms,
    shippingOptions,
    refreshBackendData,
    setCurrentView,
    isBackendConnected,
    customers,
    fetchCustomers,
  } = store;
  const ar = language === "ar";
  const L = (arabic: string, english: string) => (ar ? arabic : english);
  const [tab, setTab] = useState("overview");
  const [menu, setMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [coupon, setCoupon] = useState<any>(null);
  const [content, setContent] = useState(cms);
  const [shipping, setShipping] = useState(shippingOptions);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const seenOrders = useRef<Set<string> | null>(null);
  useEffect(() => {
    const next = new Set(orders.map((o) => o.id));
    const added = orders.filter((o) => !seenOrders.current?.has(o.id));
    if (seenOrders.current && added.length)
      setMessage(
        ar
          ? `لديك ${added.length} طلب جديد`
          : `${added.length} new order(s) received`,
      );
    seenOrders.current = next;
  }, [orders]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  useEffect(() => {
    setContent(cms);
  }, [cms]);
  useEffect(() => {
    setShipping(shippingOptions);
  }, [shippingOptions]);
  useEffect(() => {
    if (tab === "customers") fetchCustomers();
  }, [tab, fetchCustomers]);
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      await refreshBackendData();
      setMessage(L("تم الحفظ بنجاح", "Saved successfully"));
    } catch (e) {
      // Show the real reason when we have one (e.g. "photos too large combined")
      // in both languages -- a generic message here is exactly what made the
      // oversized-image failure look like silent, unexplained breakage before.
      setError(
        e instanceof Error && e.message
          ? e.message
          : L(
              "تعذر الحفظ. تحقق من البيانات والاتصال ثم حاول مرة أخرى.",
              "Unable to save. Check your data and connection, then try again.",
            ),
      );
    } finally {
      setBusy(false);
    }
  }
  const field = (
    label: string,
    value: any,
    change: (v: any) => void,
    type = "text",
    required = false,
    integer = false,
  ) => (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <input
        className={inputClass}
        type={type}
        value={value ?? ""}
        required={required}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? (integer ? "1" : "0.01") : undefined}
        onChange={(e) =>
          change(
            type === "number"
              ? e.target.value === ""
                ? undefined
                : integer
                  ? Math.round(Number(e.target.value))
                  : Number(e.target.value)
              : e.target.value,
          )
        }
      />
    </label>
  );
  const toggle = (
    label: string,
    value: boolean,
    change: (v: boolean) => void,
  ) => (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => change(e.target.checked)}
        className="h-4 w-4 accent-amber-800"
      />
      {label}
    </label>
  );
  const upload = (done: (urls: string[]) => void, multiple = true) => (
    <label className="block rounded-xl border-2 border-dashed border-stone-300 p-4 text-sm text-center cursor-pointer">
      {L(
        "اختر حتى ٨ صور (حتى ٢ ميجابايت للصورة)",
        "Upload up to 8 photos (up to 2 MB each)",
      )}
      <input
        className="block w-full mt-2 text-xs"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={async (e) => {
          try {
            const files = Array.from(e.target.files || []) as File[];
            if (files.length > 8) throw Error();
            if (
              files.some(
                (f) =>
                  f.size > 2 * 1024 * 1024 ||
                  !["image/jpeg", "image/png", "image/webp"].includes(f.type),
              )
            )
              throw Error();
            const urls = await Promise.all(
              files.map(
                (f) =>
                  new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                  }),
              ),
            );
            done(urls);
          } catch {
            setError(
              L(
                "يرجى اختيار صور صالحة لا تتجاوز ٢ ميجابايت.",
                "Please choose valid images under 2 MB.",
              ),
            );
          }
        }}
      />
    </label>
  );
  const tabs = [
    ["overview", L("نظرة عامة", "Overview"), LayoutDashboard],
    ["products", L("المنتجات", "Products"), Box],
    ["orders", L("الطلبات", "Orders"), ShoppingBag],
    ["customers", L("العملاء", "Customers"), Users],
    ["coupons", L("كوبونات الخصم", "Coupons"), Tag],
    ["content", L("الصفحة الرئيسية", "Homepage"), LayoutDashboard],
    ["shipping", L("الشحن والدفع", "Shipping & payment"), Truck],
    ["settings", L("الإعدادات", "Settings"), Settings],
    ["backup", L("النسخ والتسليم", "Backup & handover"), Download],
    ["ai", L("المساعد الذكي", "AI Assistant"), Bot],
  ] as const;
  const heading = tabs.find((t) => t[0] === tab)?.[1];
  if (!isAdmin)
    return (
      <div
        dir={dir}
        className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between mb-8">
            <button onClick={() => setCurrentView("store")}>
              {L("العودة للمتجر", "Back to store")}
            </button>
            <button onClick={() => setLanguage(ar ? "en" : "ar")}>
              <Globe size={20} />
            </button>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {L("إدارة تمور الحرمين", "Tmoor Alharmain admin")}
          </h1>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const result = await login(email, password);
              if (!result.success) setError(result.message || "");
              setBusy(false);
            }}
          >
            {field(
              L("البريد الإلكتروني", "Email"),
              email,
              setEmail,
              "email",
              true,
            )}
            {field(
              L("كلمة المرور", "Password"),
              password,
              setPassword,
              "password",
              true,
            )}
            {error && (
              <p role="alert" className="text-red-700 text-sm">
                {error}
              </p>
            )}
            <button className={buttonClass + " w-full"} disabled={busy}>
              {busy
                ? L("جارٍ تسجيل الدخول…", "Signing in…")
                : L("تسجيل الدخول", "Sign in")}
            </button>
          </form>
          <p className="mt-6 text-xs text-stone-500">
            {L(
              "يُنشأ حساب المالك على الخادم باستخدام بريد الشركة. لا توجد حسابات تجريبية أو كلمات مرور افتراضية.",
              "The owner account is provisioned on the server using your company email. There are no demo accounts or default passwords.",
            )}
          </p>
        </div>
      </div>
    );
  return (
    <div dir={dir} className="min-h-screen bg-[#F7F5F1] text-[#3B2213]">
      <aside
        className={`${menu ? "block" : "hidden"} lg:block fixed inset-y-0 start-0 z-40 w-64 bg-[#2C1D14] text-white p-5`}
      >
        <div className="flex justify-between items-center mb-9 mt-3">
          <div>
            <h1 className="font-bold text-xl">
              {L("تمور الحرمين", "Tmoor Alharmain")}
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              {L("لوحة إدارة المتجر", "Store management")}
            </p>
          </div>
          <button className="lg:hidden" onClick={() => setMenu(false)}>
            <X />
          </button>
        </div>
        <nav className="space-y-2">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setMenu(false);
                setMessage("");
                setError("");
              }}
              className={`flex w-full gap-3 items-center rounded-xl p-3 text-sm text-start ${tab === id ? "bg-[#C49755] text-[#2C1D14] font-bold" : "text-stone-300 hover:bg-white/10"}`}
            >
              <Icon size={18} />
              {label}
              {id === "orders" && (
                <span className="ms-auto text-xs">
                  {orders.filter((o) => o.orderStatus === "new").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setCurrentView("store")}
          className="mt-10 flex gap-2 text-sm text-stone-300"
        >
          <ArrowLeft size={16} />
          {L("عرض المتجر", "View store")}
        </button>
        <button
          onClick={logout}
          className="mt-5 flex gap-2 text-sm text-stone-300"
        >
          <LogOut size={16} />
          {L("تسجيل الخروج", "Sign out")}
        </button>
      </aside>
      <div className="lg:ms-64">
        <header className="bg-white border-b border-stone-200 p-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMenu(true)}>
              <Menu />
            </button>
            <span className="text-sm text-stone-500">
              {L("أهلاً بك، مدير المتجر", "Welcome, store owner")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTab("orders")}
              aria-label={L("الطلبات الجديدة", "New orders")}
              className="relative"
            >
              <Bell size={20} />
              {orders.some((o) => o.orderStatus === "new") && (
                <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-amber-600" />
              )}
            </button>
            <button
              onClick={() => setLanguage(ar ? "en" : "ar")}
              className="flex items-center gap-2 text-sm"
            >
              <Globe size={16} />
              {ar ? "English" : "العربية"}
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-xs text-stone-500 mb-1">
                {L("إدارة المتجر /", "Store management /")}
              </p>
              <h2 className="font-bold text-2xl">{heading}</h2>
            </div>
            <span
              className={`text-xs rounded-full px-3 py-1 ${isBackendConnected ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {isBackendConnected
                ? L("متصل بالخادم", "Server connected")
                : L("غير متصل", "Offline")}
            </span>
          </div>
          {message && (
            <p
              role="status"
              className="mb-4 bg-green-50 text-green-800 p-3 rounded-xl"
            >
              {message}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mb-4 bg-red-50 text-red-800 p-3 rounded-xl"
            >
              {error}
            </p>
          )}
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  [L("إجمالي الطلبات", "Total orders"), orders.length],
                  [
                    L("طلبات جديدة", "New orders"),
                    orders.filter((o) => o.orderStatus === "new").length,
                  ],
                  [L("المنتجات", "Products"), products.length],
                  [
                    L("مخزون منخفض", "Low stock"),
                    products.filter((p) => p.stock < 10).length,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-stone-200 p-5"
                  >
                    <p className="text-sm text-stone-500">{label}</p>
                    <p className="text-3xl font-bold mt-3">{value}</p>
                  </div>
                ))}
              </div>

              {products.filter((p) => p.stock < 10).length > 0 && (
                <section className="bg-red-50 p-6 border border-red-200 rounded-2xl mt-6">
                  <div className="flex items-center gap-2 text-red-800 font-bold mb-4">
                    <Box className="w-5 h-5" />
                    <h3>{L("تنبيهات انخفاض المخزون", "Low Stock Alerts")}</h3>
                  </div>
                  <div className="space-y-3">
                    {products
                      .filter((p) => p.stock < 10)
                      .map((p) => (
                        <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                          <span className="font-medium text-sm">{L(p.name, p.nameEn)}</span>
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">
                            {L(`متبقي ${p.stock}`, `${p.stock} units left`)}
                          </span>
                        </div>
                      ))}
                  </div>
                </section>
              )}
              <section className="bg-white p-6 border border-stone-200 rounded-2xl mt-6">
                <h3 className="font-bold text-lg mb-3">
                  {L(
                    "كل ما تحتاجه لإدارة متجرك",
                    "Everything you need to manage your store",
                  )}
                </h3>
                <p className="text-stone-500 text-sm leading-7">
                  {L(
                    "أضف منتجاتك وصورها باللغتين، حدّث الأسعار والمخزون، وتابع الطلبات من مكان واحد. تُحدّث تنبيهات الطلبات كل ١٥ ثانية أثناء فتح لوحة الإدارة.",
                    "Add bilingual products and photos, update prices and stock, and manage orders in one place. New-order notifications refresh every 15 seconds while the dashboard is open.",
                  )}
                </p>
                <div className="flex gap-3 mt-5 flex-wrap">
                  <button
                    className={buttonClass}
                    onClick={() => setTab("products")}
                  >
                    {L("إدارة المنتجات", "Manage products")}
                  </button>
                  <button
                    className={buttonClass}
                    onClick={() => setTab("orders")}
                  >
                    {L("متابعة الطلبات", "View orders")}
                  </button>
                </div>
              </section>
            </>
          )}
          {tab === "products" && (
            <>
              <div className="flex flex-wrap gap-3 justify-between mb-4">
                <input
                  className={inputClass + " sm:!w-80"}
                  placeholder={L(
                    "ابحث بالاسم أو الرمز…",
                    "Search by name or SKU…",
                  )}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  className={buttonClass}
                  onClick={() =>
                    setProduct({
                      name: "",
                      nameEn: "",
                      description: "",
                      descriptionEn: "",
                      weight: "",
                      weightEn: "",
                      price: 0,
                      stock: 0,
                      category: "dates",
                      images: [],
                      isHidden: false,
                      isFeatured: false,
                      sku: "",
                      rating: 0,
                      reviewsCount: 0,
                      unitType: "box",
                    })
                  }
                >
                  <Plus size={16} />
                  {L("إضافة منتج", "Add product")}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products
                  .filter((p) =>
                    `${p.name} ${p.nameEn} ${p.sku}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((p) => (
                    <article
                      key={p.id}
                      className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
                    >
                      <img
                        src={p.images[0]}
                        alt={ar ? p.name : p.nameEn}
                        loading="lazy"
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex justify-between gap-2">
                          <h3 className="font-bold">
                            {ar ? p.name : p.nameEn}
                          </h3>
                          <span className="text-xs text-stone-500">
                            {p.sku}
                          </span>
                        </div>
                        <p className="text-sm mt-2">
                          {p.salePrice ?? p.price} {L("ر.س", "SAR")}{" "}
                          {p.salePrice != null && (
                            <del className="text-stone-400 ms-2">{p.price}</del>
                          )}
                        </p>
                        <p className="text-xs mt-2 text-stone-500">
                          {p.isHidden
                            ? L("مخفي", "Hidden")
                            : p.stock === 0
                              ? L("نفد المخزون", "Out of stock")
                              : `${L("المخزون", "Stock")}: ${p.stock}`}
                        </p>
                        <div className="flex gap-4 mt-4 text-sm">
                          <button
                            className="font-bold"
                            onClick={() => setProduct({ ...p })}
                          >
                            {L("تعديل", "Edit")}
                          </button>
                          <button
                            onClick={() =>
                              action(() =>
                                request(`/api/products/${p.id}`, "PUT", {
                                  isHidden: !p.isHidden,
                                }),
                              )
                            }
                          >
                            {p.isHidden
                              ? L("إظهار", "Show")
                              : L("إخفاء", "Hide")}
                          </button>
                          <button
                            className="ms-auto text-red-700"
                            onClick={() => {
                              if (
                                confirm(
                                  L(
                                    "هل تريد حذف هذا المنتج؟",
                                    "Delete this product?",
                                  ),
                                )
                              )
                                action(() =>
                                  request(`/api/products/${p.id}`, "DELETE"),
                                );
                            }}
                          >
                            {L("حذف", "Delete")}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
              {!products.length && (
                <p>
                  {L(
                    "أضف أول منتج للبدء.",
                    "Add your first product to get started.",
                  )}
                </p>
              )}
            </>
          )}
          {tab === "orders" && (
            <div className="space-y-4">
              {!orders.length && (
                <div className="bg-white p-10 rounded-2xl text-center text-stone-500">
                  {L(
                    "لا توجد طلبات حتى الآن. ستظهر الطلبات الجديدة هنا تلقائياً.",
                    "No orders yet. New orders will appear here automatically.",
                  )}
                </div>
              )}
              {orders.map((o) => (
                <article
                  key={o.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5"
                >
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <p className="font-bold" dir="ltr">
                        {o.id}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">
                        {o.customer.fullName} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString(
                          ar ? "ar-SA" : "en-GB",
                        )}
                      </p>
                    </div>
                    <strong>
                      {o.total} {L("ر.س", "SAR")}
                    </strong>
                    <select
                      className={inputClass + " !w-auto"}
                      value={o.orderStatus}
                      disabled={busy}
                      onChange={(e) =>
                        action(() =>
                          request(`/api/orders/${o.id}/status`, "PUT", {
                            status: e.target.value,
                          }),
                        )
                      }
                    >
                      {statuses.map((s, i) => (
                        <option key={s} value={s}>
                          {ar ? statusAr[i] : s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        setSelectedOrder(selectedOrder === o.id ? null : o.id)
                      }
                      className="text-sm underline"
                    >
                      {L("التفاصيل", "Details")}
                    </button>
                  </div>
                  {selectedOrder === o.id && (
                    <div className="border-t mt-4 pt-4 text-sm space-y-3">
                      <p>
                        <a href={`tel:${o.customer.mobile}`}>
                          {o.customer.mobile}
                        </a>{" "}
                        · {o.customer.city} · {o.customer.address}
                      </p>
                      {o.customer.notes && <p>{o.customer.notes}</p>}
                      <p>
                        {o.paymentStatus === "paid"
                          ? L(
                              "تم تأكيد تحصيل المبلغ",
                              "Cash collection confirmed",
                            )
                          : L(
                              "الدفع عند الاستلام — لم يُحصّل بعد",
                              "Cash on delivery — collection pending",
                            )}
                      </p>
                      {o.orderStatus === "delivered" &&
                        o.paymentStatus === "pending" && (
                          <button
                            disabled={busy}
                            className={buttonClass}
                            onClick={() => {
                              if (
                                confirm(
                                  L(
                                    "هل استلمت مبلغ الطلب فعلياً؟",
                                    "Have you actually received payment for this order?",
                                  ),
                                )
                              )
                                action(() =>
                                  request(
                                    `/api/orders/${o.id}/collection`,
                                    "PUT",
                                    { collected: true },
                                  ),
                                );
                            }}
                          >
                            {L("تأكيد تحصيل المبلغ", "Confirm cash collected")}
                          </button>
                        )}
                      {o.items.map((i) => (
                        <p key={i.productId}>
                          {i.quantity} × {ar ? i.productName : i.productNameEn}{" "}
                          — {i.price} {L("ر.س", "SAR")}
                        </p>
                      ))}
                      <p>
                        {L("الشحن", "Shipping")}: {o.shippingFee} ·{" "}
                        {L("الخصم", "Discount")}: {o.discountAmount}
                      </p>
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          action(() =>
                            request(`/api/orders/${o.id}/status`, "PUT", {
                              status: o.orderStatus,
                              trackingNumber: data.get("tracking"),
                            }),
                          );
                        }}
                      >
                        <input
                          className={inputClass}
                          name="tracking"
                          defaultValue={o.trackingNumber}
                          placeholder={L(
                            "رقم التتبع الفعلي من شركة الشحن",
                            "Actual tracking number from carrier",
                          )}
                        />
                        <button className={buttonClass}>
                          {L("حفظ", "Save")}
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
          {tab === "customers" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">
                {L(
                  "بيانات العملاء المسجّلين الذين أضافوا عنوانهم ورقم جوالهم من حسابهم.",
                  "Registered customers who saved their address and mobile number from their account.",
                )}
              </p>
              {customers.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm">
                  {L("لا يوجد عملاء مسجّلون بعد.", "No registered customers yet.")}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {customers.map((c) => (
                    <article
                      key={c.id}
                      className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">{c.name}</h3>
                        {!c.phone && !c.address && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            {L("لم يكمل بياناته", "Incomplete")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 font-mono truncate">{c.email}</p>
                      {c.phone && (
                        <a
                          dir="ltr"
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-2 text-sm text-stone-700 hover:text-amber-700"
                        >
                          <Phone size={14} /> {c.phone}
                        </a>
                      )}
                      {(c.city || c.address) && (
                        <div className="flex items-start gap-2 text-sm text-stone-700">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span>
                            {c.city}
                            {c.city && c.address ? " — " : ""}
                            {c.address}
                          </span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === "coupons" && (
            <>
              <button
                className={buttonClass + " mb-4"}
                onClick={() =>
                  setCoupon({
                    code: "",
                    discountType: "percentage",
                    discountValue: 10,
                    minOrderValue: 0,
                    expiresAt: "",
                    isActive: true,
                  })
                }
              >
                <Plus size={16} />
                {L("إضافة كوبون", "Add coupon")}
              </button>
              <div className="grid sm:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5"
                  >
                    <strong dir="ltr">{c.code}</strong>
                    <p className="text-sm my-3">
                      {c.discountValue}
                      {c.discountType === "percentage"
                        ? "%"
                        : L(" ر.س", " SAR")}{" "}
                      · {L("ينتهي", "Expires")} {c.expiresAt} ·{" "}
                      {c.isActive ? L("نشط", "Active") : L("متوقف", "Inactive")}
                    </p>
                    <div className="flex gap-5 text-sm">
                      <button onClick={() => setCoupon({ ...c })}>
                        {L("تعديل", "Edit")}
                      </button>
                      <button
                        className="text-red-700"
                        onClick={() => {
                          if (confirm(L("حذف الكوبون؟", "Delete coupon?")))
                            action(() =>
                              request(`/api/coupons/${c.id}`, "DELETE"),
                            );
                        }}
                      >
                        {L("حذف", "Delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "content" && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                action(() => request("/api/cms", "PUT", content));
              }}
            >
              <section className="bg-white border rounded-2xl p-5 space-y-4">
                <h3 className="font-bold">
                  {L("شريط الإعلان", "Announcement bar")}
                </h3>
                {toggle(
                  L("إظهار الإعلان", "Show announcement"),
                  content.announcementEnabled,
                  (v) => setContent({ ...content, announcementEnabled: v }),
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {field(
                    L("الإعلان بالعربية", "Announcement — Arabic"),
                    content.announcementText,
                    (v) => setContent({ ...content, announcementText: v }),
                  )}
                  {field(
                    L("الإعلان بالإنجليزية", "Announcement — English"),
                    content.announcementTextEn,
                    (v) => setContent({ ...content, announcementTextEn: v }),
                  )}
                </div>
              </section>
              {[
                ...content.heroSlides.map((s, i) => ({ slide: s, index: i })),
                { slide: content.promoBanner, index: -1 },
              ].map(({ slide, index }) => {
                const change = (key: string, value: any) =>
                  setContent((prev) =>
                    index < 0
                      ? {
                          ...prev,
                          promoBanner: { ...prev.promoBanner, [key]: value },
                        }
                      : {
                          ...prev,
                          heroSlides: prev.heroSlides.map((s, i) =>
                            i === index ? { ...s, [key]: value } : s,
                          ),
                        },
                  );
                return (
                  <section
                    key={index}
                    className="bg-white rounded-2xl border p-5 space-y-4"
                  >
                    <h3 className="font-bold">
                      {index < 0
                        ? L("بانر العروض", "Offers banner")
                        : `${L("البانر الرئيسي", "Hero banner")} ${index + 1}`}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        ["title", "العنوان بالعربية", "Title — Arabic"],
                        ["titleEn", "العنوان بالإنجليزية", "Title — English"],
                        ["subtitle", "الوصف بالعربية", "Subtitle — Arabic"],
                        [
                          "subtitleEn",
                          "الوصف بالإنجليزية",
                          "Subtitle — English",
                        ],
                        ["ctaText", "نص الزر بالعربية", "Button — Arabic"],
                        [
                          "ctaTextEn",
                          "نص الزر بالإنجليزية",
                          "Button — English",
                        ],
                      ].map(([key, a, en]) => (
                        <React.Fragment key={key}>
                          {field(L(a, en), (slide as any)[key], (v) =>
                            change(key, v),
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    {field(
                      L(
                        "رابط الزر (مثل #products)",
                        "Button link (for example #products)",
                      ),
                      slide.ctaLink,
                      (v) => change("ctaLink", v),
                    )}
                    <img
                      src={slide.imageUrl}
                      className="h-36 w-full object-cover rounded-xl"
                      alt=""
                    />
                    {upload((urls) => change("imageUrl", urls[0]), false)}
                    {field(
                      L("أو رابط الصورة", "Or image URL"),
                      slide.imageUrl.startsWith("data:") ? "" : slide.imageUrl,
                      (v) => change("imageUrl", v),
                    )}
                  </section>
                );
              })}
              <button className={buttonClass} disabled={busy}>
                {L("حفظ محتوى الصفحة", "Save homepage content")}
              </button>
            </form>
          )}
          {tab === "shipping" && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  for (const s of shipping)
                    await request(`/api/shipping/${s.id}`, "PUT", s);
                  await request("/api/cms", "PUT", {
                    freeShippingThreshold: content.freeShippingThreshold,
                  });
                });
              }}
            >
              <section className="bg-white p-5 border rounded-2xl">
                {field(
                  L(
                    "الحد الأدنى للشحن المجاني (ر.س)",
                    "Free shipping threshold (SAR)",
                  ),
                  content.freeShippingThreshold,
                  (v) => setContent({ ...content, freeShippingThreshold: v }),
                  "number",
                  true,
                )}
              </section>
              {shipping.map((c, i) => (
                <section
                  key={c.id}
                  className="bg-white p-5 border rounded-2xl space-y-4"
                >
                  <h3 className="font-bold">{ar ? c.name : c.nameEn}</h3>
                  {toggle(
                    L("شركة شحن متاحة", "Carrier enabled"),
                    c.isEnabled !== false,
                    (v) =>
                      setShipping(
                        shipping.map((s, j) =>
                          j === i ? { ...s, isEnabled: v } : s,
                        ),
                      ),
                  )}
                  {field(
                    L("الرسوم الافتراضية (ر.س)", "Default fee (SAR)"),
                    c.cost,
                    (v) =>
                      setShipping(
                        shipping.map((s, j) =>
                          j === i ? { ...s, cost: v } : s,
                        ),
                      ),
                    "number",
                    true,
                  )}
                  <details>
                    <summary className="cursor-pointer text-sm font-bold">
                      {L("رسوم خاصة حسب المدينة", "City-specific fees")}
                    </summary>
                    <p className="text-xs text-stone-500 my-3">
                      {L(
                        "اترك الحقل فارغاً لاستخدام الرسوم الافتراضية.",
                        "Leave blank to use the default carrier fee.",
                      )}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SAUDI_CITIES.map((city, k) => (
                        <React.Fragment key={city}>
                          {field(
                            ar ? city : CITY_NAMES_EN[k],
                            c.cityRates?.[city],
                            (v) =>
                              setShipping(
                                shipping.map((s, j) =>
                                  j === i
                                    ? {
                                        ...s,
                                        cityRates: {
                                          ...s.cityRates,
                                          [city]: v,
                                        },
                                      }
                                    : s,
                                ),
                              ),
                            "number",
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </details>
                </section>
              ))}
              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm leading-7">
                <strong>
                  {L("بوابة الدفع غير متصلة", "Payment gateway not connected")}
                </strong>
                <p>
                  {L(
                    "الدفع عند الاستلام متاح حالياً. دعم مدى وأبل باي وفيزا وماستركارد يتطلب اختيار بوابة وربط حساب شركتك واختبار الدفع والتحقق من إشعارات البوابة. لن يتم استخدام أي حساب للمطور.",
                    "Cash on delivery is currently available. Mada, Apple Pay, Visa and Mastercard require your chosen gateway, company account, payment testing and verified webhooks. No developer account will be used.",
                  )}
                </p>
              </section>
              <button className={buttonClass} disabled={busy}>
                {L("حفظ إعدادات الشحن", "Save shipping settings")}
              </button>
            </form>
          )}
          {tab === "settings" && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                action(() => request("/api/cms", "PUT", content));
              }}
            >
              {[
                ["contact", L("معلومات التواصل", "Contact information")],
                ["social", L("روابط التواصل الاجتماعي", "Social media links")],
                [
                  "pixels",
                  L(
                    "معرّفات التحليلات والإعلانات",
                    "Analytics & advertising IDs",
                  ),
                ],
                ["seo", L("تحسين محركات البحث", "Search engine optimization")],
              ].map(([group, title]) => (
                <section
                  key={group}
                  className="bg-white p-5 border rounded-2xl"
                >
                  <h3 className="font-bold mb-4">{title}</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries((content as any)[group] || {}).map(
                      ([key, value]) => {
                        const labels: Record<string, string[]> = {
                          metaTitle: [
                            "عنوان البحث بالعربية",
                            "SEO title — Arabic",
                          ],
                          metaTitleEn: [
                            "عنوان البحث بالإنجليزية",
                            "SEO title — English",
                          ],
                          metaDescription: [
                            "وصف البحث بالعربية",
                            "SEO description — Arabic",
                          ],
                          metaDescriptionEn: [
                            "وصف البحث بالإنجليزية",
                            "SEO description — English",
                          ],
                          metaKeywords: ["كلمات مفتاحية", "Keywords"],
                          phone: ["الهاتف", "Phone"],
                          whatsapp: ["واتساب", "WhatsApp"],
                          email: ["البريد الإلكتروني", "Email"],
                          crNumber: [
                            "السجل التجاري",
                            "Commercial registration",
                          ],
                          taxNumber: ["الرقم الضريبي", "Tax number"],
                          address: ["العنوان بالعربية", "Address — Arabic"],
                          addressEn: [
                            "العنوان بالإنجليزية",
                            "Address — English",
                          ],
                          mapsUrl: [
                            "رابط خرائط جوجل (اختياري)",
                            "Google Maps link (optional)",
                          ],
                          instagram: ["إنستغرام", "Instagram"],
                          tiktok: ["تيك توك", "TikTok"],
                          snapchat: ["سناب شات", "Snapchat"],
                          x: ["إكس", "X"],
                          metaPixelId: ["معرّف ميتا بيكسل", "Meta Pixel ID"],
                          tiktokPixelId: [
                            "معرّف تيك توك بيكسل",
                            "TikTok Pixel ID",
                          ],
                          snapchatPixelId: [
                            "معرّف سناب شات بيكسل",
                            "Snapchat Pixel ID",
                          ],
                          googleAnalyticsId: [
                            "معرّف جوجل أناليتكس",
                            "Google Analytics ID",
                          ],
                        };
                        return (
                          <React.Fragment key={key}>
                            {field(
                              L(
                                ...((labels[key] || [key, key]) as [
                                  string,
                                  string,
                                ]),
                              ),
                              value,
                              (v) =>
                                setContent({
                                  ...content,
                                  [group]: {
                                    ...(content as any)[group],
                                    [key]: v,
                                  },
                                }),
                            )}
                          </React.Fragment>
                        );
                      },
                    )}
                  </div>
                  {group === "pixels" && (
                    <p className="text-xs text-stone-500 mt-4">
                      {L(
                        "تُحفظ المعرّفات فقط. لم تُفعّل أي أدوات تتبع؛ يلزم إعداد موافقة الخصوصية قبل الإطلاق.",
                        "IDs are saved only. Tracking is not activated; configure privacy consent before launch.",
                      )}
                    </p>
                  )}
                </section>
              ))}
              <button className={buttonClass} disabled={busy}>
                {L("حفظ الإعدادات", "Save settings")}
              </button>
            </form>
          )}
          {tab === "backup" && (
            <section className="bg-white p-6 border rounded-2xl space-y-5">
              <h3 className="font-bold text-lg">
                {L("بياناتك وحساباتك ملك لك", "Your store, your accounts")}
              </h3>
              <p className="text-sm leading-7 text-stone-600">
                {L(
                  "يجب تسجيل النطاق والاستضافة وبوابة الدفع وجميع الخدمات باسم شركتك وبريدك. لم يتم شراء أو ربط أي خدمة مدفوعة. دليل التسليم في ملف HANDOVER.md يشرح الإعداد والنسخ الكامل والاستعادة.",
                  "Register the domain, hosting, gateway and all services using your company name and email. No paid services have been purchased or connected. HANDOVER.md explains setup, full backups and recovery.",
                )}
              </p>
              <button
                className={buttonClass}
                onClick={() =>
                  action(async () => {
                    const data = await request("/api/database/backup", "POST");
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(data, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `haramain-data-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  })
                }
              >
                <Download size={16} />
                {L("تنزيل بيانات المتجر", "Download store data")}
              </button>
              <p className="text-xs text-stone-500">
                {L(
                  "يشمل المنتجات والصور والطلبات والإعدادات. لا يشمل كلمات المرور أو كود الموقع. للنسخة الكاملة استخدم أمر النسخ على الخادم الوارد في دليل التسليم.",
                  "Includes products, uploaded images, orders and settings. Excludes password hashes and website source code. For a complete backup, use the server backup command in the handover guide.",
                )}
              </p>
            </section>
          )}
          {tab === "ai" && (
            <section className="bg-white p-6 border rounded-2xl space-y-5">
              <h3 className="font-bold text-lg text-amber-600 flex items-center gap-2">
                <Bot /> {L("مساعد الذكاء الاصطناعي", "AI Command Center")}
              </h3>
              <p className="text-sm leading-7 text-stone-600">
                {L(
                  "أخبر المساعد بما تريده وسيقوم بتنفيذه. جرب: 'أضف منتج جديد باسم تمر عجوة الفاخر بسعر 50 ريال وضع صورة مناسبة'.",
                  "Tell the AI what you want to do. Try: 'Add a new product called Premium Ajwa for 50 SAR and generate a nice image'."
                )}
              </p>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!aiPrompt.trim() && !aiImage) return;
                  const currentPrompt = aiPrompt;
                  const currentImage = aiImage;
                  setAiPrompt("");
                  setAiImage(null);
                  action(async () => {
                    const data = await request("/api/ai/admin-command", "POST", { command: currentPrompt, image: currentImage });
                    if (data.success) {
                      setAiResponses([{ prompt: currentPrompt, intent: data.intent, product: data.product, reply: data.reply }, ...aiResponses]);
                      if (data.intent === "create_product") {
                        refreshBackendData();
                      }
                    }
                  });
                }}
              >
                {aiImage && (
                  <div className="relative inline-block">
                    <img src={aiImage} alt="Reference" className="w-24 h-24 object-cover rounded-xl border border-stone-200 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setAiImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <textarea
                  className={inputClass}
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={L("ماذا تريد أن تفعل اليوم؟", "What do you want to do today?")}
                />
                <div className="flex gap-3 items-center">
                  <label className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 text-stone-600 border border-stone-200 px-4 py-2.5 text-sm font-bold hover:bg-stone-200 cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setAiImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <ImageIcon size={18} /> {L("إرفاق صورة", "Attach Image")}
                  </label>
                  <button type="submit" disabled={busy || (!aiPrompt.trim() && !aiImage)} className={buttonClass + " flex-1"}>
                    {busy ? L("جاري التنفيذ...", "Executing...") : L("تنفيذ", "Execute Command")}
                  </button>
                </div>
              </form>

              {aiResponses.length > 0 && (
                <div className="space-y-4 mt-6">
                  {aiResponses.map((res, i) => (
                    <div key={i} className="p-4 bg-stone-50 border rounded-xl space-y-3">
                      {res.prompt && (
                        <p className="text-sm text-stone-500 italic">"{res.prompt}"</p>
                      )}
                      {(res.intent === "chat" || res.intent === "mistake" || res.reply) && (
                        <div className={`p-4 rounded-xl border text-sm leading-7 ${res.intent === "mistake" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-white border-stone-200 text-stone-800"}`}>
                          {res.reply}
                        </div>
                      )}
                      {res.product && (
                        <div className="bg-white border border-green-200 rounded-xl overflow-hidden">
                          {/* Product image — large so admin can confirm it's correct */}
                          {res.product.images?.[0] && (
                            <div className="w-full aspect-video bg-stone-100 overflow-hidden">
                              <img
                                src={res.product.images[0]}
                                alt={ar ? res.product.name : res.product.nameEn}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-base text-[#2C1D11]">{res.product.name}</p>
                                <p className="text-sm text-stone-500">{res.product.nameEn}</p>
                              </div>
                              <span className="text-xs bg-green-100 text-green-800 font-semibold px-2.5 py-1 rounded-full shrink-0">
                                ✓ {L("تم الإنشاء", "Created")}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-stone-50 rounded-lg px-3 py-2">
                                <p className="text-xs text-stone-400">{L("السعر", "Price")}</p>
                                <p className="font-bold text-amber-700">{res.product.price} {L("ر.س", "SAR")}</p>
                              </div>
                              <div className="bg-stone-50 rounded-lg px-3 py-2">
                                <p className="text-xs text-stone-400">{L("الوزن", "Weight")}</p>
                                <p className="font-bold text-stone-700">{ar ? res.product.weight : res.product.weightEn}</p>
                              </div>
                              <div className="bg-stone-50 rounded-lg px-3 py-2">
                                <p className="text-xs text-stone-400">{L("المخزون", "Stock")}</p>
                                <p className="font-bold text-stone-700">{res.product.stock}</p>
                              </div>
                              <div className="bg-stone-50 rounded-lg px-3 py-2">
                                <p className="text-xs text-stone-400">{L("الفئة", "Category")}</p>
                                <p className="font-bold text-stone-700">{res.product.category}</p>
                              </div>
                            </div>
                            {res.product.sku && (
                              <p className="text-xs text-stone-400 font-mono">{L("الرمز", "SKU")}: {res.product.sku}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </main>
      </div>
      {(product || coupon) && (
        <div className="fixed inset-0 z-50 bg-black/50 p-3 sm:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-5 sm:p-7 my-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-xl">
                {product
                  ? L("بيانات المنتج", "Product details")
                  : L("كوبون الخصم", "Discount coupon")}
              </h3>
              <button
                onClick={() => {
                  setProduct(null);
                  setCoupon(null);
                }}
                aria-label={L("إغلاق", "Close")}
              >
                <X />
              </button>
            </div>
            {error && (
              <p role="alert" className="text-red-700 mb-4">
                {error}
              </p>
            )}
            {product && (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  action(async () => {
                    await request(
                      `/api/products${product.id ? "/" + product.id : ""}`,
                      product.id ? "PUT" : "POST",
                      { ...product, salePrice: product.salePrice ?? null },
                    );
                    setProduct(null);
                  });
                }}
              >
                <p className="text-sm text-stone-500">
                  {L(
                    "أدخل المحتوى باللغتين لضمان عرض صحيح لجميع العملاء.",
                    "Enter both languages so every customer sees fully translated content.",
                  )}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(
                    [
                      ["name", "الاسم بالعربية", "Name — Arabic", true],
                      ["nameEn", "الاسم بالإنجليزية", "Name — English", true],
                      ["weight", "الوزن بالعربية", "Weight — Arabic", true],
                      ["weightEn", "الوزن بالإنجليزية", "Weight — English", true],
                      ["origin", "المنشأ بالعربية (اختياري)", "Origin — Arabic (optional)", false],
                      ["originEn", "المنشأ بالإنجليزية (اختياري)", "Origin — English (optional)", false],
                    ] as [string, string, string, boolean][]
                  ).map(([key, a, en, isRequired]) => (
                    <React.Fragment key={key}>
                      {field(
                        L(a, en),
                        product[key],
                        (v) => setProduct({ ...product, [key]: v }),
                        "text",
                        isRequired,
                      )}
                    </React.Fragment>
                  ))}
                  <div className="sm:col-span-2 space-y-2">
                    <span className="block text-sm font-medium">
                      {L("يُباع بـ", "Sold by")}
                    </span>
                    <div className="flex flex-wrap gap-4">
                      {(
                        [
                          ["box", Package, "الصندوق / العلبة", "Box / pack"],
                          ["kg", Weight, "الكيلوجرام (وزن)", "Kilogram (by weight)"],
                          ["pcs", Hash, "القطعة (عدد)", "Piece (by count)"],
                        ] as [string, typeof Package, string, string][]
                      ).map(([value, Icon, a, en]) => (
                        <label
                          key={value}
                          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                            (product.unitType || "box") === value
                              ? "border-amber-700 bg-amber-50 font-bold"
                              : "border-stone-200 hover:bg-stone-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="unitType"
                            className="accent-amber-800"
                            checked={(product.unitType || "box") === value}
                            onChange={() => setProduct({ ...product, unitType: value })}
                          />
                          <Icon size={16} />
                          {L(a, en)}
                        </label>
                      ))}
                    </div>
                  </div>
                  {field(
                    L("السعر العادي", "Regular price"),
                    product.price,
                    (v) => setProduct({ ...product, price: v }),
                    "number",
                    true,
                  )}
                  {field(
                    L("سعر العرض (اختياري)", "Sale price (optional)"),
                    product.salePrice,
                    (v) => setProduct({ ...product, salePrice: v }),
                    "number",
                  )}
                  {field(
                    L("كمية المخزون", "Stock quantity"),
                    product.stock,
                    (v) => setProduct({ ...product, stock: v }),
                    "number",
                    true,
                    true,
                  )}
                  {field(
                    L("رمز المنتج", "SKU"),
                    product.sku,
                    (v) => setProduct({ ...product, sku: v }),
                    "text",
                    true,
                  )}
                  <label className="text-sm space-y-1.5">
                    <span>{L("القسم", "Category")}</span>
                    <select
                      className={inputClass}
                      value={product.category}
                      onChange={(e) =>
                        setProduct({ ...product, category: e.target.value })
                      }
                    >
                      {categories.map((c, i) => (
                        <option key={c} value={c}>
                          {ar ? categoryAr[i] : c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {["description", "descriptionEn"].map((key) => (
                  <label key={key} className="block text-sm space-y-2">
                    <span>
                      {key === "description"
                        ? L("الوصف بالعربية", "Description — Arabic")
                        : L("الوصف بالإنجليزية", "Description — English")}
                    </span>
                    <textarea
                      className={inputClass}
                      required
                      rows={3}
                      value={product[key] || ""}
                      onChange={(e) =>
                        setProduct({ ...product, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                {upload((urls) =>
                  setProduct({
                    ...product,
                    images: [...product.images, ...urls].slice(0, 8),
                  }),
                )}
                <div className="flex flex-wrap gap-3">
                  {product.images.map((url: string, i: number) => (
                    <div key={i} className="relative">
                      <img
                        src={url}
                        alt=""
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        aria-label={L("حذف الصورة", "Remove image")}
                        className="absolute top-0 end-0 bg-white rounded-full p-1"
                        onClick={() =>
                          setProduct({
                            ...product,
                            images: product.images.filter(
                              (_: string, j: number) => j !== i,
                            ),
                          })
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* ── Pack / Crate Size Options ── */}
                <div className="border border-stone-200 rounded-2xl p-4 space-y-3 bg-amber-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-stone-800">
                        {L("أحجام التعبئة والأكراتون", "Pack & Crate Size Options")}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {L(
                          "أضف أحجام مختلفة (علبة 500 جرام، كيلو، كرتون 5 كيلو…) وسعر لكل حجم. سيختار العميل من هذه الخيارات عند الشراء.",
                          "Add size variants (500g box, 1kg, 5kg crate…) with a price per size. Customers pick from these when ordering.",
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs bg-[#3B2213] text-white px-3 py-1.5 rounded-lg shrink-0"
                      onClick={() =>
                        setProduct({
                          ...product,
                          packSizes: [
                            ...(product.packSizes || []),
                            { label: "", labelEn: "", price: product.price || 0 },
                          ],
                        })
                      }
                    >
                      <Plus size={12} /> {L("إضافة حجم", "Add size")}
                    </button>
                  </div>

                  {(product.packSizes || []).length === 0 && (
                    <p className="text-xs text-stone-400 text-center py-2">
                      {L(
                        "لا توجد أحجام — أضف حجماً أو اتركه فارغاً إذا كنت تبيع بحجم واحد.",
                        "No sizes yet — add a size or leave empty for single-size products.",
                      )}
                    </p>
                  )}

                  {(product.packSizes || []).map((ps: any, idx: number) => (
                    <div
                      key={idx}
                      className="grid sm:grid-cols-4 gap-2 items-end bg-white border border-stone-200 p-3 rounded-xl"
                    >
                      <label className="block text-xs font-medium space-y-1">
                        <span>{L("التسمية بالعربية", "Arabic label")}</span>
                        <input
                          className={inputClass + " !text-xs !py-1.5"}
                          placeholder={L("مثال: علبة 500 جرام", "e.g. 500g Box")}
                          value={ps.label}
                          onChange={(e) => {
                            const updated = [...(product.packSizes || [])];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setProduct({ ...product, packSizes: updated });
                          }}
                        />
                      </label>
                      <label className="block text-xs font-medium space-y-1">
                        <span>{L("التسمية بالإنجليزية", "English label")}</span>
                        <input
                          className={inputClass + " !text-xs !py-1.5"}
                          placeholder="e.g. 500g Box"
                          value={ps.labelEn}
                          onChange={(e) => {
                            const updated = [...(product.packSizes || [])];
                            updated[idx] = { ...updated[idx], labelEn: e.target.value };
                            setProduct({ ...product, packSizes: updated });
                          }}
                        />
                      </label>
                      <label className="block text-xs font-medium space-y-1">
                        <span>{L("السعر (ر.س)", "Price (SAR)")}</span>
                        <input
                          className={inputClass + " !text-xs !py-1.5"}
                          type="number"
                          min="0"
                          step="0.01"
                          value={ps.price}
                          onChange={(e) => {
                            const updated = [...(product.packSizes || [])];
                            updated[idx] = { ...updated[idx], price: Number(e.target.value) };
                            setProduct({ ...product, packSizes: updated });
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="text-red-600 text-xs flex items-center gap-1 justify-center py-1.5 border border-red-200 rounded-lg hover:bg-red-50"
                        onClick={() => {
                          const updated = (product.packSizes || []).filter((_: any, j: number) => j !== idx);
                          setProduct({ ...product, packSizes: updated });
                        }}
                      >
                        <X size={12} /> {L("حذف", "Remove")}
                      </button>
                    </div>
                  ))}
                </div>

                {toggle(
                  L("منتج مميز", "Featured product"),
                  product.isFeatured,
                  (v) => setProduct({ ...product, isFeatured: v }),
                )}
                {toggle(
                  L("إخفاء من المتجر", "Hide from storefront"),
                  product.isHidden,
                  (v) => setProduct({ ...product, isHidden: v }),
                )}
                <button
                  disabled={busy || !product.images.length}
                  className={buttonClass}
                >
                  {busy
                    ? L("جارٍ الحفظ…", "Saving…")
                    : L("حفظ المنتج", "Save product")}
                </button>
              </form>
            )}
            {coupon && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  action(async () => {
                    await request(
                      `/api/coupons${coupon.id ? "/" + coupon.id : ""}`,
                      coupon.id ? "PUT" : "POST",
                      { ...coupon, code: coupon.code.toUpperCase().trim() },
                    );
                    setCoupon(null);
                  });
                }}
              >
                {field(
                  L(
                    "الكود (حروف إنجليزية وأرقام)",
                    "Code (English letters and numbers)",
                  ),
                  coupon.code,
                  (v) => setCoupon({ ...coupon, code: v }),
                  "text",
                  true,
                )}
                <select
                  className={inputClass}
                  value={coupon.discountType}
                  onChange={(e) =>
                    setCoupon({ ...coupon, discountType: e.target.value })
                  }
                >
                  <option value="percentage">
                    {L("نسبة مئوية", "Percentage")}
                  </option>
                  <option value="fixed">
                    {L("مبلغ ثابت", "Fixed amount")}
                  </option>
                </select>
                {field(
                  L("قيمة الخصم", "Discount value"),
                  coupon.discountValue,
                  (v) => setCoupon({ ...coupon, discountValue: v }),
                  "number",
                  true,
                )}
                {field(
                  L("الحد الأدنى للطلب", "Minimum order"),
                  coupon.minOrderValue,
                  (v) => setCoupon({ ...coupon, minOrderValue: v }),
                  "number",
                  true,
                )}
                {field(
                  L("تاريخ الانتهاء", "Expiry date"),
                  coupon.expiresAt,
                  (v) => setCoupon({ ...coupon, expiresAt: v }),
                  "date",
                  true,
                )}
                {toggle(L("نشط", "Active"), coupon.isActive, (v) =>
                  setCoupon({ ...coupon, isActive: v }),
                )}
                <button disabled={busy} className={buttonClass}>
                  {L("حفظ الكوبون", "Save coupon")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

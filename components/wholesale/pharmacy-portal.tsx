"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Bell,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  ShoppingBag,
  Store,
  Truck,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cancelPharmacyOrder, createPharmacyOrder } from "@/app/actions/pharmacy"
import { authClient } from "@/lib/auth-client"
import { PharmacyAccount, PharmacyCart, PharmacyCatalog, PharmacyHome, PharmacyInvoices, PharmacyOrders } from "./pharmacy-views"
import type { CartLine, CheckoutDetails, Invoice, Order, Pharmacy, Product } from "./types"

type PortalTab = "home" | "catalog" | "cart" | "orders" | "invoices" | "account"
type PortalProfile = Pharmacy & { phone: string }

type Props = {
  email: string
  profile: PortalProfile
  initialProducts: Product[]
  initialOrders: Order[]
}

const navigation: Array<{ id: PortalTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "home", label: "الرئيسية", icon: LayoutDashboard },
  { id: "catalog", label: "كتالوج الأدوية", icon: Package },
  { id: "cart", label: "سلة الطلبات", icon: ShoppingBag },
  { id: "orders", label: "طلباتي", icon: ClipboardList },
  { id: "invoices", label: "الفواتير", icon: FileText },
  { id: "account", label: "حساب الصيدلية", icon: Store },
]

const pageCopy: Record<PortalTab, { title: string; subtitle: string }> = {
  home: { title: "الرئيسية", subtitle: "نظرة سريعة على حساب الصيدلية وطلباتها" },
  catalog: { title: "كتالوج الأدوية", subtitle: "استعرض منتجات الشركة وأضف احتياجاتك إلى السلة" },
  cart: { title: "سلة الطلبات", subtitle: "راجع الكميات وتفاصيل التسليم قبل حفظ الطلب" },
  orders: { title: "طلباتي", subtitle: "تابع الطلبات المحفوظة في حساب صيدليتك" },
  invoices: { title: "الفواتير", subtitle: "راجع الفواتير المرتبطة بطلباتك" },
  account: { title: "حساب الصيدلية", subtitle: "بيانات ملف الصيدلية المسجل" },
}

export function PharmacyPortal({ email, profile, initialProducts, initialOrders }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<PortalTab>("home")
  const [products, setProducts] = useState(initialProducts)
  const [orders, setOrders] = useState(initialOrders)
  const [cart, setCart] = useState<CartLine[]>([])
  const [catalogQuery, setCatalogQuery] = useState("")
  const [feedback, setFeedback] = useState<{ message: string; tone: "success" | "error" } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const invoices: Invoice[] = []
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const page = pageCopy[tab]
  const initials = profile.contact.trim().slice(0, 1) || "ص"

  function addToCart(productId: string) {
    const product = products.find((item) => item.id === productId)
    const current = cart.find((item) => item.productId === productId)?.quantity ?? 0
    if (!product || current >= product.stock - product.reserved) return
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.productId === productId)
      return existing
        ? currentCart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...currentCart, { productId, quantity: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((currentCart) => currentCart.flatMap((item) => item.productId !== productId ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))
  }

  function applyAvailability(availability: Array<{ id: string; stock: number; reserved: number }>) {
    setProducts((current) => current.map((product) => {
      const updated = availability.find((item) => item.id === product.id)
      return updated ? { ...product, stock: updated.stock, reserved: updated.reserved } : product
    }))
  }

  async function submitOrder(details: CheckoutDetails) {
    if (isSubmitting || cart.length === 0) return
    setIsSubmitting(true)
    setFeedback(null)
    try {
      const result = await createPharmacyOrder(cart, details)
      if (!result.ok) {
        setFeedback({ message: result.error, tone: "error" })
        return
      }
      applyAvailability(result.data.availability)
      setOrders((current) => [result.data.order, ...current])
      setCart([])
      setTab("orders")
      setFeedback({ message: "تم حفظ الطلب في حساب صيدليتك.", tone: "success" })
    } catch {
      setFeedback({ message: "تعذر حفظ الطلب الآن. حاول مرة أخرى.", tone: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function cancelOrder(orderId: string) {
    setFeedback(null)
    const result = await cancelPharmacyOrder(orderId)
    if (!result.ok) {
      setFeedback({ message: result.error, tone: "error" })
      return
    }
    applyAvailability(result.data.availability)
    setOrders((current) => current.map((order) => order.id === orderId ? result.data.order : order))
    setFeedback({ message: "تم إلغاء الطلب وتحديث الكميات المتاحة.", tone: "success" })
  }

  function reorder(orderId: string) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    const nextCart = order.items.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)
      const available = product ? product.stock - product.reserved : 0
      return product && available > 0 ? [{ productId: item.productId, quantity: Math.min(item.quantity, available) }] : []
    })
    setCart(nextCart)
    setTab("cart")
    setFeedback(nextCart.length ? { message: "أضيفت الأصناف المتاحة من طلبك السابق إلى السلة.", tone: "success" } : { message: "لا توجد كميات متاحة لإعادة هذا الطلب.", tone: "error" })
  }

  async function signOut() {
    await authClient.signOut()
    router.replace("/sign-in")
    router.refresh()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Store aria-hidden="true" /></span>
          <span className="brand-copy"><strong>الشاعر</strong><small>بوابة الصيدليات</small></span>
        </div>

        <div className="workspace-switcher" aria-label={`حساب ${profile.name}`}>
          <span className="workspace-icon"><Store aria-hidden="true" /></span>
          <span><small>حساب الصيدلية</small><strong>{profile.name}</strong></span>
        </div>

        <nav className="side-nav" aria-label="القائمة الرئيسية">
          <p className="nav-caption">مساحة الصيدلية</p>
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" className={tab === item.id ? "nav-link active" : "nav-link"} aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                {item.id === "cart" && cartCount > 0 && <span className="nav-count">{cartCount}</span>}
                {item.id === "orders" && orders.length > 0 && <span className="nav-count">{orders.length}</span>}
              </button>
            )
          })}
        </nav>

        <div className="portal-switches" aria-label="التطبيقات الأخرى">
          <span className="nav-caption">تطبيقات أخرى</span>
          <Link className="portal-switch" href="/company">
            <Building2 aria-hidden="true" />
            <span><strong>تطبيق الشركة</strong><small>إدارة العمليات</small></span>
          </Link>
          <Link className="portal-switch" href="/driver">
            <Truck aria-hidden="true" />
            <span><strong>تطبيق المندوب</strong><small>التوصيل والطلبات</small></span>
          </Link>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-icon">i</span><div><strong>مساعدة الحساب</strong><small>بياناتك خاصة بحسابك</small></div></div>
          <button className="user-mini signout-button" type="button" onClick={signOut}>
            <span className="user-avatar" aria-hidden="true">{initials}</span>
            <span><strong>{profile.contact}</strong><small dir="ltr">{email}</small></span>
            <LogOut aria-hidden="true" />
            <span className="sr-only">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title"><span className="eyebrow">بوابة الشاعر · الصيدليات</span><h1>{page.title}</h1><p>{page.subtitle}</p></div>
          <div className="topbar-actions">
            <label className="global-search"><Search aria-hidden="true" /><input value={catalogQuery} onFocus={() => setTab("catalog")} onChange={(event) => { setCatalogQuery(event.target.value); setTab("catalog") }} placeholder="ابحث في الكتالوج" aria-label="البحث في كتالوج المنتجات" /><kbd>بحث</kbd></label>
            <button className="notification-button" type="button" onClick={() => setTab("orders")} aria-label="الانتقال إلى الطلبات"><Bell aria-hidden="true" />{orders.some((order) => order.orderStatus === "pending") && <span />}</button>
          </div>
        </header>

        <div className="company-data-notice" role="note"><span className="company-data-notice-icon">i</span><p><strong>حساب مرتبط بالشركة:</strong> يعرض هذا الكتالوج المنتجات التي أتاحتها الشركة لحسابك.</p></div>
        <section className="content-area" aria-label={page.title}>
          {feedback && <div className={`portal-feedback ${feedback.tone}`} role={feedback.tone === "error" ? "alert" : "status"}><span>{feedback.message}</span><button type="button" aria-label="إغلاق التنبيه" onClick={() => setFeedback(null)}><X aria-hidden="true" /></button></div>}
          {tab === "home" && <PharmacyHome pharmacyName={profile.name} products={products} orders={orders} invoices={invoices} onAdd={addToCart} onNavigate={setTab} onReorder={reorder} />}
          {tab === "catalog" && <PharmacyCatalog pharmacyName={profile.name} products={products} cart={cart} query={catalogQuery} onQueryChange={setCatalogQuery} onAdd={addToCart} onNavigate={setTab} />}
          {tab === "cart" && <PharmacyCart pharmacyName={profile.name} contactName={profile.contact} phone={profile.phone} address={profile.region} isSubmitting={isSubmitting} products={products} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onSubmit={submitOrder} />}
          {tab === "orders" && <PharmacyOrders orders={orders} onCancel={cancelOrder} onReorder={reorder} />}
          {tab === "invoices" && <PharmacyInvoices invoices={invoices} orders={orders} />}
          {tab === "account" && <PharmacyAccount pharmacy={profile} outstandingBalance={0} onNavigate={setTab} />}
        </section>
      </main>
    </div>
  )
}

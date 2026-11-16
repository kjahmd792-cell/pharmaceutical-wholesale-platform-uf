"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Store,
  Tag,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react"
import { BranchesView, OffersView, SettingsView } from "./feature-views"
import { CompanyDashboard, InvoicesView, InventoryView, OrdersView, PharmaciesView } from "./company-views"
import { CompanyDispatchView } from "./dispatch-view"
import { CompanyTeamView } from "./company-team-view"
import { DeliveryView } from "./delivery-view"
import { PharmacyAccount, PharmacyCart, PharmacyCatalog, PharmacyHome, PharmacyInvoices, PharmacyOrders } from "./pharmacy-views"
import { ReportsView } from "./reports-view"
import { PharmacyOtpAlerts, PharmacyOtpBell } from "./pharmacy-otp-notifications"
import { demoDeliveryAgents, demoInvoices, demoOrders, demoPharmacies, demoProducts } from "./demo-data"
import { formatCurrency } from "./shared"
import type { CartLine, CheckoutDetails, DeliveryStatus, Invoice, Order, Pharmacy, Product } from "./types"

export type DemoRole = "owner" | "inventory" | "orders" | "dispatcher" | "driver" | "pharmacy"
type Tab = "overview" | "orders" | "inventory" | "pharmacies" | "deliveries" | "invoices" | "reports" | "team" | "branches" | "offers" | "settings" | "home" | "catalog" | "cart" | "account"
type InitialRole = "company" | "driver" | "pharmacy"
type Props = { initialRole: InitialRole; initialDemoRole?: DemoRole }

type NavItem = { id: Tab; label: string; icon: LucideIcon; badge?: string }

const companyNavigation: NavItem[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "orders", label: "الطلبات", icon: ClipboardList },
  { id: "inventory", label: "المخزون", icon: Boxes },
  { id: "pharmacies", label: "الصيدليات", icon: Store },
  { id: "deliveries", label: "التوصيل", icon: Truck },
  { id: "invoices", label: "الفواتير والتحصيل", icon: FileText },
  { id: "reports", label: "التقارير", icon: BarChart3 },
  { id: "team", label: "الفريق والصلاحيات", icon: Users },
  { id: "branches", label: "الفروع والتغطية", icon: Building2, badge: "جديد" },
  { id: "offers", label: "العروض التجارية", icon: Tag, badge: "جديد" },
  { id: "settings", label: "إعدادات الشركة", icon: Settings },
]

const pharmacyNavigation: NavItem[] = [
  { id: "home", label: "الرئيسية", icon: LayoutDashboard },
  { id: "catalog", label: "كتالوج المنتجات", icon: Package },
  { id: "cart", label: "سلة الطلبات", icon: ClipboardList },
  { id: "orders", label: "طلباتي", icon: Truck },
  { id: "invoices", label: "الفواتير", icon: FileText },
  { id: "account", label: "حساب الصيدلية", icon: Store },
]

const roleNavigation: Record<DemoRole, Tab[]> = {
  owner: ["overview", "orders", "inventory", "pharmacies", "deliveries", "invoices", "reports", "team", "branches", "offers", "settings"],
  inventory: ["overview", "inventory", "branches"],
  orders: ["overview", "orders", "pharmacies", "invoices", "reports"],
  dispatcher: ["overview", "orders", "deliveries", "branches"],
  driver: ["deliveries"],
  pharmacy: ["home", "catalog", "cart", "orders", "invoices", "account"],
}

const roleLabels: Record<DemoRole, string> = {
  owner: "مالك الشركة",
  inventory: "مسؤول المخزون",
  orders: "مسؤول الطلبات",
  dispatcher: "مسؤول التوصيل",
  driver: "مندوب التوصيل",
  pharmacy: "حساب الصيدلية",
}

const pageCopy: Record<Tab, { title: string; subtitle: string }> = {
  overview: { title: "لوحة المعلومات", subtitle: "ملخص عمليات شركة الشاعر للتوزيع الدوائي" },
  orders: { title: "الطلبات", subtitle: "مراجعة الطلبات ومتابعة حالتها خطوة بخطوة" },
  inventory: { title: "المخزون", subtitle: "المنتجات والكميات والتنبيهات في مكان واحد" },
  pharmacies: { title: "الصيدليات", subtitle: "متابعة العملاء وحالة الطلبات لكل صيدلية" },
  deliveries: { title: "الإسناد والتوصيل", subtitle: "توزيع الطلبات ومتابعة مسارات التسليم" },
  invoices: { title: "الفواتير والتحصيل", subtitle: "متابعة الفواتير والمبالغ المستحقة" },
  reports: { title: "التقارير والتحليلات", subtitle: "قراءة سريعة لحركة المبيعات والتشغيل" },
  team: { title: "الفريق والصلاحيات", subtitle: "استعراض الأدوار المقترحة داخل الشركة" },
  branches: { title: "الفروع والتغطية", subtitle: "نظرة على شبكة التوزيع المقترحة" },
  offers: { title: "العروض التجارية", subtitle: "حملات وأفكار لتنمية المبيعات" },
  settings: { title: "إعدادات الشركة", subtitle: "تفضيلات مساحة العمل وبياناتها" },
  home: { title: "الرئيسية", subtitle: "ملخص حساب الصيدلية" },
  catalog: { title: "كتالوج المنتجات", subtitle: "تصفح المنتجات وأضف احتياجاتك إلى السلة" },
  cart: { title: "سلة الطلبات", subtitle: "راجع الأصناف وتفاصيل التسليم قبل الإرسال" },
  account: { title: "حساب الصيدلية", subtitle: "بيانات الحساب والرصيد التجريبي" },
}

const startTab = (role: DemoRole): Tab => role === "driver" ? "deliveries" : role === "pharmacy" ? "home" : role === "inventory" ? "inventory" : role === "orders" ? "orders" : role === "dispatcher" ? "deliveries" : "overview"

export function WholesaleApp({ initialRole, initialDemoRole }: Props) {
  const [activeRole, setActiveRole] = useState<DemoRole>(() => initialDemoRole ?? (initialRole === "company" ? "owner" : initialRole))
  const [tab, setTab] = useState<Tab>(() => startTab(initialDemoRole ?? (initialRole === "company" ? "owner" : initialRole)))
  const [orders, setOrders] = useState<Order[]>(() => demoOrders.map((order) => ({ ...order, items: order.items.map((item) => ({ ...item })), deliveryProof: order.deliveryProof ? { ...order.deliveryProof } : undefined })))
  const [products, setProducts] = useState<Product[]>(() => demoProducts.map((product) => ({ ...product })))
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(() => demoPharmacies.map((pharmacy) => ({ ...pharmacy })))
  const [invoices, setInvoices] = useState<Invoice[]>(() => demoInvoices.map((invoice) => ({ ...invoice })))
  const [cart, setCart] = useState<CartLine[]>([])
  const [driverName, setDriverName] = useState(demoDeliveryAgents[0].name)
  const [catalogQuery, setCatalogQuery] = useState("")
  const [feedback, setFeedback] = useState("")

  const isCompany = !["driver", "pharmacy"].includes(activeRole)
  const isPharmacy = activeRole === "pharmacy"
  const isDriver = activeRole === "driver"
  const currentPharmacy = demoPharmacies[0]
  const pharmacyOrders = orders.filter((order) => order.pharmacy === currentPharmacy.name)
  const pharmacyInvoices = invoices.filter((invoice) => invoice.pharmacy === currentPharmacy.name)
  const navItems = isPharmacy
    ? pharmacyNavigation
    : companyNavigation.filter((item) => roleNavigation[activeRole].includes(item.id))
  const page = pageCopy[tab]
  const currentDriverId = demoDeliveryAgents.find((agent) => agent.name === driverName)?.id
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0)
  const outstandingBalance = pharmacyInvoices.reduce((total, invoice) => total + Math.max(invoice.total - invoice.paidAmount, 0), 0)

  function notify(message: string) {
    setFeedback(message)
  }

  function switchRole(role: DemoRole) {
    setActiveRole(role)
    setTab(startTab(role))
    setFeedback("")
  }

  function addToCart(productId: string) {
    const product = products.find((item) => item.id === productId)
    const currentQuantity = cart.find((item) => item.productId === productId)?.quantity ?? 0
    if (!product || currentQuantity >= product.stock - product.reserved) return
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      return existing
        ? current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { productId, quantity: 1 }]
    })
    notify("أُضيف المنتج إلى السلة التجريبية.")
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.flatMap((item) => item.productId !== productId ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))
  }

  function submitOrder(details: CheckoutDetails) {
    const lineItems = cart.flatMap((line) => {
      const product = products.find((item) => item.id === line.productId)
      return product ? [{ productId: product.id, name: product.name, quantity: line.quantity, unitPrice: product.price }] : []
    })
    if (!lineItems.length) return notify("أضف منتجًا واحدًا على الأقل قبل إرسال الطلب.")
    const nextNumber = Math.max(240, ...orders.map((order) => Number(order.id.replace("ORD-", "")) || 0)) + 1
    const order: Order = {
      id: `ORD-${nextNumber}`,
      pharmacy: currentPharmacy.name,
      pharmacyPhone: details.phone,
      recipientName: details.recipientName,
      deliveryAddress: details.address,
      requestedDeliveryWindow: details.deliveryWindow,
      region: currentPharmacy.region,
      items: lineItems,
      total: lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
      orderStatus: "pending",
      deliveryStatus: null,
      paymentStatus: "unpaid",
      paymentMethod: details.paymentMethod,
      paidAmount: 0,
      assignedTo: null,
      createdAt: new Date().toISOString(),
      invoiceId: null,
      note: details.note,
    }
    setOrders((current) => [order, ...current])
    setProducts((current) => current.map((product) => {
      const ordered = lineItems.find((item) => item.productId === product.id)?.quantity ?? 0
      return ordered ? { ...product, reserved: product.reserved + ordered } : product
    }))
    setCart([])
    setTab("orders")
    notify(`تم إنشاء الطلب التجريبي ${order.id}. لن يُحفظ بعد مغادرة العرض.`)
  }

  function reorderOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    setCart(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })))
    setTab("cart")
    notify("تمت إعادة الأصناف إلى السلة التجريبية.")
  }

  function cancelPharmacyOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId)
    if (!order || order.orderStatus !== "pending") return
    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, orderStatus: "cancelled" } : item))
    setProducts((current) => current.map((product) => {
      const reserved = order.items.find((item) => item.productId === product.id)?.quantity ?? 0
      return reserved ? { ...product, reserved: Math.max(0, product.reserved - reserved) } : product
    }))
    notify(`تم إلغاء ${orderId} في العرض التجريبي.`)
  }

  function updateOrder(order: Order) {
    setOrders((current) => current.map((item) => item.id === order.id ? order : item))
    if (!order.invoiceId) return
    const nextInvoice: Invoice = { id: order.invoiceId, orderId: order.id, pharmacy: order.pharmacy, issuedAt: order.createdAt, total: order.total, paidAmount: order.paidAmount, paymentMethod: order.paymentMethod }
    setInvoices((current) => current.some((item) => item.orderId === order.id)
      ? current.map((item) => item.orderId === order.id ? nextInvoice : item)
      : [nextInvoice, ...current])
  }

  function advanceOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    const nextStatus = order.orderStatus === "pending" ? "accepted" : order.orderStatus === "accepted" ? "preparing" : order.orderStatus === "preparing" ? "ready" : null
    if (!nextStatus) return
    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, orderStatus: nextStatus } : item))
    notify(`تم تحديث الطلب ${orderId} داخل العرض التجريبي.`)
  }

  function rejectOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, orderStatus: "rejected", rejectionReason: "رفض تجريبي من لوحة الشركة" } : item))
    setProducts((current) => current.map((product) => {
      const reserved = order.items.find((item) => item.productId === product.id)?.quantity ?? 0
      return reserved ? { ...product, reserved: Math.max(0, product.reserved - reserved) } : product
    }))
    notify(`تم رفض ${orderId} داخل العرض التجريبي.`)
  }

  function assignDelivery(orderId: string, agentId: string) {
    const order = orders.find((item) => item.id === orderId)
    const agent = demoDeliveryAgents.find((item) => item.id === agentId)
    if (!order || !agent) return
    const invoiceId = order.invoiceId ?? `INV-${order.id.replace("ORD-", "")}`
    updateOrder({ ...order, orderStatus: "out_for_delivery", deliveryStatus: "assigned", assignedTo: agent.id, invoiceId })
    notify(`تم إسناد ${orderId} إلى ${agent.name} في العرض التجريبي.`)
  }

  function restock(productId: string, quantity: number) {
    setProducts((current) => current.map((product) => product.id === productId ? { ...product, stock: product.stock + quantity } : product))
    notify(`تمت إضافة ${quantity.toLocaleString("ar-SA")} وحدة إلى المخزون التجريبي؛ لن تُحفظ التغييرات.`)
  }

  function saveProduct(product: Product) {
    setProducts((current) => current.some((item) => item.id === product.id)
      ? current.map((item) => item.id === product.id ? product : item)
      : [product, ...current])
    notify(`تم تحديث ${product.name} في بيانات العرض التجريبي.`)
  }

  function togglePharmacy(pharmacyId: string) {
    setPharmacies((current) => current.map((pharmacy) => pharmacy.id === pharmacyId
      ? { ...pharmacy, status: pharmacy.status === "approved" ? "suspended" : "approved" }
      : pharmacy))
    notify("تم تحديث الحالة داخل العرض التجريبي فقط.")
  }

  function updateDelivery(orderId: string, status: DeliveryStatus) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    const orderStatus = status === "delivered" ? "delivered" : ["assigned", "on_way", "arrived"].includes(status) ? "out_for_delivery" : order.orderStatus
    updateOrder({ ...order, deliveryStatus: status, orderStatus })
    notify("تم تحديث حالة التوصيل في بيانات العرض.")
  }

  function completeDelivery(orderId: string, recipient: string, collectedAmount: number, paymentMethod: string, note: string, otpVerified = false) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    const paidAmount = Math.min(order.total, order.paidAmount + Math.max(0, collectedAmount))
    const paymentStatus = paidAmount >= order.total ? "paid" : paidAmount > 0 ? "partially_paid" : "unpaid"
    updateOrder({
      ...order,
      orderStatus: "delivered",
      deliveryStatus: "delivered",
      paidAmount,
      paymentStatus,
      deliveryProof: { recipient, collectedAmount, paymentMethod, note, deliveredAt: new Date().toISOString(), otpVerified },
    })
    setProducts((current) => current.map((product) => {
      const delivered = order.items.filter((item) => item.productId === product.id).reduce((total, item) => total + item.quantity, 0)
      return delivered ? { ...product, stock: Math.max(0, product.stock - delivered), reserved: Math.max(0, product.reserved - delivered) } : product
    }))
    notify(`تم تسجيل تسليم ${orderId} تجريبيًا وتحديث التحصيل.`)
  }

  function failDelivery(orderId: string, reason: string, note: string) {
    setOrders((current) => current.map((order) => order.id === orderId
      ? { ...order, deliveryStatus: "failed", orderStatus: "ready", rejectionReason: note ? `${reason} — ${note}` : reason }
      : order))
    notify(`تم تسجيل تعذر تسليم ${orderId} في العرض التجريبي.`)
  }

  function renderCompanyContent() {
    if (tab === "overview") return <CompanyDashboard orders={orders} products={products} pharmacies={pharmacies} onNavigate={setTab} />
    if (tab === "orders") return <OrdersView orders={orders} onAdvance={advanceOrder} onReject={rejectOrder} />
    if (tab === "inventory") return <InventoryView products={products} onRestock={restock} onSaveProduct={saveProduct} />
    if (tab === "pharmacies") return <PharmaciesView pharmacies={pharmacies} onToggleStatus={togglePharmacy} />
    if (tab === "deliveries") return <CompanyDispatchView orders={orders} agents={demoDeliveryAgents} onAssign={assignDelivery} />
    if (tab === "invoices") return <InvoicesView invoices={invoices} />
    if (tab === "reports") return <ReportsView orders={orders} invoices={invoices} products={products} />
    if (tab === "team") return <CompanyTeamView />
    if (tab === "branches") return <BranchesView />
    if (tab === "offers") return <OffersView />
    return <SettingsView />
  }

  function renderPharmacyContent() {
    if (tab === "home") return <PharmacyHome pharmacyName={currentPharmacy.name} products={products} orders={pharmacyOrders} invoices={pharmacyInvoices} onAdd={addToCart} onNavigate={setTab} onReorder={reorderOrder} />
    if (tab === "catalog") return <PharmacyCatalog pharmacyName={currentPharmacy.name} products={products} cart={cart} query={catalogQuery} onQueryChange={setCatalogQuery} onAdd={addToCart} onNavigate={setTab} />
    if (tab === "cart") return <PharmacyCart products={products} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onSubmit={submitOrder} pharmacyName={currentPharmacy.name} contactName="مها العتيبي" phone={currentPharmacy.contact} address={currentPharmacy.region} isSubmitting={false} />
    if (tab === "orders") return <PharmacyOrders orders={pharmacyOrders} agents={demoDeliveryAgents} onCancel={cancelPharmacyOrder} onReorder={reorderOrder} />
    if (tab === "invoices") return <PharmacyInvoices invoices={pharmacyInvoices} orders={pharmacyOrders} />
    return <PharmacyAccount pharmacy={currentPharmacy} outstandingBalance={outstandingBalance} onNavigate={setTab} />
  }

  const content = isDriver
    ? <DeliveryView orders={orders} driverName={driverName} driverId={currentDriverId} agents={demoDeliveryAgents} onDriverChange={setDriverName} onStatusChange={updateDelivery} onComplete={completeDelivery} onFail={failDelivery} onOpenPharmacy={() => switchRole("pharmacy")} />
    : isPharmacy
      ? renderPharmacyContent()
      : renderCompanyContent()

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="الشاعر للتوزيع الدوائي">
          <span className="brand-mark"><Activity aria-hidden="true" /></span>
          <span className="brand-copy"><strong>الشاعر</strong><small>للتوزيع الدوائي</small></span>
        </Link>
        <div className="workspace-switcher">
          <span className="workspace-icon">{isCompany ? <Building2 aria-hidden="true" /> : isDriver ? <Truck aria-hidden="true" /> : <Store aria-hidden="true" />}</span>
          <span><small>{isCompany ? "مساحة الشركة" : isDriver ? "حساب المندوب" : "حساب الصيدلية"}</small><strong>شركة الشاعر · عرض تجريبي</strong></span>
        </div>
        <div className="demo-role-control">
          <label htmlFor="demo-role-switch">تبديل واجهة العرض</label>
          <select id="demo-role-switch" value={activeRole} onChange={(event) => switchRole(event.target.value as DemoRole)}>
            <optgroup label="فريق الشركة"><option value="owner">مالك الشركة</option><option value="inventory">مسؤول المخزون</option><option value="orders">مسؤول الطلبات</option><option value="dispatcher">مسؤول التوصيل</option></optgroup>
            <optgroup label="واجهات العملاء"><option value="driver">مندوب التوصيل</option><option value="pharmacy">حساب الصيدلية</option></optgroup>
          </select>
          <small>{roleLabels[activeRole]} · دخول تجريبي سريع</small>
        </div>
        <nav className="side-nav" aria-label="التنقل الرئيسي">
          <span className="nav-caption">{isCompany ? "عمليات الشركة" : isDriver ? "مسار التوصيل" : "مساحة الصيدلية"}</span>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = tab === item.id
            return <button key={item.id} type="button" className={isActive ? "nav-link active" : "nav-link"} aria-current={isActive ? "page" : undefined} onClick={() => { setTab(item.id); setFeedback("") }}>
              <Icon aria-hidden="true" /><span>{item.label}</span>{item.badge && <span className="nav-new-badge">{item.badge}</span>}{item.id === "orders" && orders.some((order) => order.orderStatus === "pending") && <span className="nav-dot" />}{item.id === "cart" && cartCount > 0 && <span className="nav-count">{cartCount}</span>}
            </button>
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link className="demo-login-shortcut" href="/company/sign-in"><Users aria-hidden="true" /><span><strong>حسابات تجريبية</strong><small>دخول سريع لكل الواجهات</small></span></Link>
          <div className="sidebar-help"><span className="help-icon">i</span><div><strong>نسخة عرض تجريبية</strong><small>التغييرات لا تُحفظ</small></div></div>
          <div className="user-mini demo-user-mini"><span className="user-avatar" aria-hidden="true">{roleLabels[activeRole].slice(0, 1)}</span><span><strong>{roleLabels[activeRole]}</strong><small>demo@alshaer.local</small></span></div>
        </div>
      </aside>

      <main className="main-area" id="main">
        <header className="topbar">
          <div className="topbar-title"><span className="eyebrow">الشاعر للتوزيع الدوائي · شركة واحدة</span><h1>{page.title}</h1><p>{page.subtitle}</p></div>
          <div className="topbar-actions">{isPharmacy && <PharmacyOtpBell pharmacyName={currentPharmacy.name} />}<span className="count-badge">واجهة تجريبية</span><Link className="subtle-button quick-login-button" href="/company/sign-in">اختيار حساب <Users aria-hidden="true" /></Link></div>
        </header>
        <div className="company-data-notice demo-data-notice" role="note"><span className="company-data-notice-icon">i</span><p><strong>وضع العرض:</strong> البيانات توضيحية، وأي تعديل يظل مؤقتًا داخل هذه الجلسة.</p></div>
        {feedback && <div className="feedback-message" role="status" aria-live="polite"><span>✓</span>{feedback}<button type="button" onClick={() => setFeedback("")} aria-label="إخفاء الإشعار">×</button></div>}
        <div className="page-content">{isPharmacy && <PharmacyOtpAlerts pharmacyName={currentPharmacy.name} />}{content}</div>
        <footer className="app-footer"><span>الشاعر · مساحة عمليات موحّدة</span><span>نسخة عرض للعميل · لا توجد بيانات فعلية</span></footer>
      </main>
    </div>
  )
}

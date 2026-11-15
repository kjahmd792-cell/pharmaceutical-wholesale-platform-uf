"use client"

import { useMemo, useState, type FormEvent } from "react"
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react"
import { formatCurrency, formatTime, OrderStatusPill, PaymentStatusPill, SectionCard, SectionHeading, StatusPill } from "./shared"
import type { CartLine, CheckoutDetails, DeliveryAgent, Invoice, Order, Pharmacy, Product } from "./types"

type PharmacyDestination = "catalog" | "cart" | "orders" | "invoices" | "account"

export function PharmacyHome({
  pharmacyName,
  products,
  orders,
  invoices,
  onAdd,
  onNavigate,
  onReorder,
}: {
  pharmacyName: string
  products: Product[]
  orders: Order[]
  invoices: Invoice[]
  onAdd: (productId: string) => void
  onNavigate: (tab: PharmacyDestination) => void
  onReorder: (orderId: string) => void
}) {
  const pharmacyOrders = orders.filter((order) => order.pharmacy === pharmacyName)
  const latestOrders = [...pharmacyOrders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3)
  const openOrders = pharmacyOrders.filter((order) => !["delivered", "rejected", "cancelled"].includes(order.orderStatus)).length
  const outstanding = invoices
    .filter((invoice) => invoice.pharmacy === pharmacyName)
    .reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paidAmount, 0), 0)
  const orderedQuantities = pharmacyOrders.reduce<Record<string, number>>((totals, order) => {
    order.items.forEach((item) => {
      totals[item.productId] = (totals[item.productId] ?? 0) + item.quantity
    })
    return totals
  }, {})
  const frequentlyOrdered = [...products]
    .sort((a, b) => (orderedQuantities[b.id] ?? 0) - (orderedQuantities[a.id] ?? 0))
    .slice(0, 3)

  return (
    <div className="view-stack">
      <div className="pharmacy-hero pharmacy-home-hero">
        <div>
          <span className="eyebrow light-eyebrow">مرحبًا بك في حساب الصيدلية</span>
          <h2>{pharmacyName}</h2>
          <p>اطلب احتياجاتك، تابع التسليم، وراجع رصيدك من مكان واحد.</p>
          <div className="pharmacy-home-actions">
            <button className="pharmacy-hero-action" onClick={() => onNavigate("catalog")}>
              تصفح الكتالوج <ArrowLeft aria-hidden="true" />
            </button>
            {latestOrders[0] && (
              <button className="pharmacy-hero-secondary" onClick={() => onReorder(latestOrders[0].id)}>
                إعادة آخر طلب <RotateCcw aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="pharmacy-account"><span className="account-check">✓</span><span>حساب تجريبي</span></div>
      </div>

      <div className="summary-strip pharmacy-home-summary">
        <div className="summary-card"><span className="summary-icon teal"><ShoppingBag aria-hidden="true" /></span><div><span>طلبات قيد التنفيذ</span><strong>{openOrders}</strong></div></div>
        <div className="summary-card"><span className="summary-icon amber"><Wallet aria-hidden="true" /></span><div><span>الرصيد المستحق</span><strong>{formatCurrency(outstanding)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon violet"><FileText aria-hidden="true" /></span><div><span>إجمالي الطلبات</span><strong>{pharmacyOrders.length}</strong></div></div>
      </div>

      <div className="pharmacy-home-grid">
        <SectionCard title="آخر الطلبات" description="حالة أحدث الطلبات في العرض التجريبي.">
          {latestOrders.length ? (
            <div className="pharmacy-home-order-list">
              {latestOrders.map((order) => (
                <div className="pharmacy-home-order" key={order.id}>
                  <div className="pharmacy-home-order-copy">
                    <strong>{order.id}</strong>
                    <span><Clock3 aria-hidden="true" /> {formatTime(order.createdAt)}</span>
                  </div>
                  <OrderStatusPill status={order.orderStatus} />
                  <strong className="pharmacy-home-order-total">{formatCurrency(order.total)}</strong>
                </div>
              ))}
              <button className="text-action" onClick={() => onNavigate("orders")}>عرض كل الطلبات <ArrowLeft aria-hidden="true" /></button>
            </div>
          ) : (
            <div className="cart-empty"><span className="empty-icon"><ShoppingBag aria-hidden="true" /></span><strong>لا توجد طلبات بعد</strong><p>ابدأ بطلبك الأول من الكتالوج.</p></div>
          )}
        </SectionCard>

        <SectionCard title="الأكثر طلبًا" description="أصناف توضيحية من سجل الطلبات التجريبي.">
          <div className="frequent-product-list">
            {frequentlyOrdered.map((product) => (
              <div className="frequent-product" key={product.id}>
                <span className="product-mini-icon"><Package aria-hidden="true" /></span>
                <div><strong>{product.name}</strong><small>{orderedQuantities[product.id] ?? 0} وحدة في الطلبات السابقة</small></div>
                <button className="icon-button" aria-label={`إضافة ${product.name} إلى السلة`} onClick={() => { onAdd(product.id); onNavigate("cart") }} disabled={product.stock <= product.reserved}><Plus aria-hidden="true" /></button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

export function PharmacyCatalog({
  pharmacyName,
  products,
  cart,
  query,
  onQueryChange,
  onAdd,
  onNavigate,
}: {
  pharmacyName: string
  products: Product[]
  cart: CartLine[]
  query: string
  onQueryChange: (value: string) => void
  onAdd: (productId: string) => void
  onNavigate: (tab: PharmacyDestination) => void
}) {
  const [category, setCategory] = useState("الكل")
  const categories = ["الكل", ...Array.from(new Set(products.map((product) => product.category)))]
  const searchTerm = query.trim().toLocaleLowerCase("ar")
  const filtered = useMemo(() => products.filter((product) => {
    const searchableText = `${product.name} ${product.scientificName} ${product.category} ${product.id} ${product.code} ${product.manufacturer}`.toLocaleLowerCase("ar")
    return searchableText.includes(searchTerm) && (category === "الكل" || product.category === category)
  }), [products, searchTerm, category])
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <div className="view-stack">
      <div className="pharmacy-hero">
        <div><span className="eyebrow light-eyebrow">مرحبًا بعودتك</span><h2>{pharmacyName}</h2><p>تصفح الكتالوج وأرسل طلبات تجريبية لفريق التوزيع.</p></div>
        <div className="pharmacy-account"><span className="account-check">✓</span><span>حساب تجريبي</span></div>
      </div>
      <div className="catalog-toolbar">
        <label className="search-control catalog-search"><Search aria-hidden="true" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="ابحث باسم المنتج أو المادة أو الرمز" aria-label="ابحث في كتالوج الأدوية" /></label>
        <div className="category-list" aria-label="تصفية حسب فئة المنتج">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} className={category === item ? "filter-chip active" : "filter-chip"} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <button type="button" className="catalog-cart-summary" onClick={() => onNavigate("cart")}><ShoppingBag aria-hidden="true" /><span>{cartCount} وحدة في السلة</span><ArrowLeft aria-hidden="true" /></button>
      </div>
      <div className="product-grid">
        {filtered.map((product) => {
          const cartQuantity = cart.find((line) => line.productId === product.id)?.quantity ?? 0
          const available = Math.max(product.stock - product.reserved, 0)
          return <article className="product-card" key={product.id}>
            <div className="product-card-top"><span className="product-art"><Package aria-hidden="true" /></span>{product.tag && <StatusPill tone={product.tag === "مخزون منخفض" ? "amber" : "teal"}>{product.tag}</StatusPill>}</div>
            <div className="product-card-copy"><span className="product-category">{product.category} · {product.id}</span><h3>{product.name}</h3><p>{product.scientificName}</p><span className="product-manufacturer">{product.manufacturer}</span></div>
            <div className="product-pack-row"><span>{product.pack}</span><span>{available} متاح</span></div>
            <div className="product-card-bottom"><div><strong>{formatCurrency(product.price)}</strong><small>للوحدة · سعر الوحدة</small></div><button type="button" className={cartQuantity ? "add-to-cart added" : "add-to-cart"} onClick={() => onAdd(product.id)} disabled={available <= cartQuantity} aria-label={`إضافة ${product.name} إلى السلة`}>{cartQuantity ? `أضف المزيد (${cartQuantity})` : "إضافة للسلة"}<Plus aria-hidden="true" /></button></div>
          </article>
        })}
        {filtered.length === 0 && <div className="table-empty">لا توجد منتجات مطابقة. جرّب كلمة بحث أو فئة أخرى.</div>}
      </div>
    </div>
  )
}

export function PharmacyCart({ products, cart, onAdd, onRemove, onSubmit, pharmacyName, contactName, phone, address, isSubmitting }: {
  products: Product[]
  cart: CartLine[]
  onAdd: (productId: string) => void
  onRemove: (productId: string) => void
  onSubmit: (details: CheckoutDetails) => void | Promise<void>
  pharmacyName: string
  contactName: string
  phone: string
  address: string
  isSubmitting: boolean
}) {
  const [checkout, setCheckout] = useState<CheckoutDetails>({
    recipientName: contactName,
    phone,
    address,
    deliveryWindow: "أي وقت",
    paymentMethod: "آجل",
    note: "",
  })
  const rows = cart.map((line) => ({ line, product: products.find((item) => item.id === line.productId) })).filter((item): item is { line: CartLine; product: Product } => Boolean(item.product))
  const total = rows.reduce((sum, item) => sum + item.product.price * item.line.quantity, 0)

  function updateCheckout<K extends keyof CheckoutDetails>(key: K, value: CheckoutDetails[K]) {
    setCheckout((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(checkout)
  }

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="الشراء" title="سلة المشتريات" description="راجع الكميات والأسعار وأدخل تفاصيل التسليم." action={<span className="count-badge"><ShoppingBag aria-hidden="true" /> {rows.length} أصناف</span>} />
      <div className="cart-layout">
        <SectionCard title="الأصناف المختارة" description="يمكنك تعديل الكمية قبل إرسال الطلب.">
          {rows.length === 0 ? <div className="cart-empty"><span className="empty-icon"><ShoppingBag aria-hidden="true" /></span><strong>السلة فارغة</strong><p>أضف منتجات من كتالوج الشركة لتكوين طلب.</p></div> : <div className="cart-items">{rows.map(({ line, product }) => {
            const available = Math.max(product.stock - product.reserved, 0)
            return <article className="cart-item" key={product.id}><span className="product-mini-icon"><Package aria-hidden="true" /></span><div className="cart-product-copy"><strong>{product.name}</strong><small>{product.pack}</small><span>{formatCurrency(product.price)} للوحدة</span></div><div className="quantity-control"><button type="button" onClick={() => onRemove(product.id)} aria-label={`تقليل كمية ${product.name}`}><Minus aria-hidden="true" /></button><span aria-live="polite">{line.quantity}</span><button type="button" onClick={() => onAdd(product.id)} disabled={line.quantity >= available} aria-label={`زيادة كمية ${product.name}`}><Plus aria-hidden="true" /></button></div><strong className="cart-line-total">{formatCurrency(product.price * line.quantity)}</strong></article>
          })}</div>}
        </SectionCard>
        <form className="checkout-card" onSubmit={handleSubmit}>
          <div className="checkout-heading"><span><ShoppingBag aria-hidden="true" /></span><div><strong>تفاصيل الطلب والتسليم</strong><small>{pharmacyName}</small></div></div>
          <div className="checkout-lines"><div><span>عدد الأصناف</span><strong>{rows.length}</strong></div><div><span>إجمالي الوحدات</span><strong>{rows.reduce((sum, row) => sum + row.line.quantity, 0)}</strong></div></div>
          <div className="checkout-total"><span>الإجمالي التقديري</span><strong>{formatCurrency(total)}</strong></div>
          <div className="checkout-fields">
            <label className="checkout-field">اسم المستلم<input required autoComplete="name" maxLength={80} value={checkout.recipientName} onChange={(event) => updateCheckout("recipientName", event.target.value)} /></label>
            <label className="checkout-field">رقم التواصل<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={checkout.phone} onChange={(event) => updateCheckout("phone", event.target.value)} /></label>
            <label className="checkout-field checkout-field-full">عنوان التسليم<textarea required minLength={8} maxLength={240} rows={2} value={checkout.address} onChange={(event) => updateCheckout("address", event.target.value)} /></label>
            <label className="checkout-field">الفترة المناسبة<select value={checkout.deliveryWindow} onChange={(event) => updateCheckout("deliveryWindow", event.target.value)}><option>أي وقت</option><option>صباحًا</option><option>بعد الظهر</option></select></label>
            <label className="checkout-field">طريقة السداد<select value={checkout.paymentMethod} onChange={(event) => updateCheckout("paymentMethod", event.target.value)}><option>آجل</option><option>تحويل بنكي</option><option>نقدًا عند التسليم</option></select></label>
            <label className="checkout-field checkout-field-full">ملاحظة للتسليم <span>اختياري</span><textarea maxLength={300} rows={2} value={checkout.note} onChange={(event) => updateCheckout("note", event.target.value)} placeholder="تعليمات إضافية للمندوب" /></label>
          </div>
          <button className="primary-button checkout-submit" type="submit" disabled={!rows.length || isSubmitting}>{isSubmitting ? "جارٍ حفظ الطلب..." : "إرسال الطلب"} <ArrowDownLeft aria-hidden="true" /></button>
          <p className="checkout-disclaimer">طلب تجريبي فقط؛ سيظهر في قائمة العرض الحالية ولن يُحفظ أو يُرسل لأي جهة.</p>
        </form>
      </div>
    </div>
  )
}

export function PharmacyOrders({ orders, onCancel, onReorder, agents = [] }: {
  orders: Order[]
  onCancel: (orderId: string) => void
  onReorder: (orderId: string) => void
  agents?: DeliveryAgent[]
}) {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "attention">("all")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const pharmacyOrders = [...orders]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const matchesFilter = (order: Order) => {
    if (filter === "active") return !["delivered", "rejected", "cancelled"].includes(order.orderStatus)
    if (filter === "completed") return order.orderStatus === "delivered"
    if (filter === "attention") return ["rejected", "cancelled"].includes(order.orderStatus) || order.deliveryStatus === "failed"
    return true
  }
  const visibleOrders = pharmacyOrders.filter(matchesFilter)
  const filters = [
    { id: "all" as const, label: "الكل", count: pharmacyOrders.length },
    { id: "active" as const, label: "قيد التنفيذ", count: pharmacyOrders.filter((order) => !["delivered", "rejected", "cancelled"].includes(order.orderStatus)).length },
    { id: "completed" as const, label: "مكتملة", count: pharmacyOrders.filter((order) => order.orderStatus === "delivered").length },
    { id: "attention" as const, label: "تحتاج متابعة", count: pharmacyOrders.filter((order) => ["rejected", "cancelled"].includes(order.orderStatus) || order.deliveryStatus === "failed").length },
  ]
  const steps: { status: Order["orderStatus"]; label: string }[] = [
    { status: "pending", label: "مراجعة" },
    { status: "accepted", label: "اعتماد" },
    { status: "preparing", label: "تجهيز" },
    { status: "ready", label: "جاهز" },
    { status: "out_for_delivery", label: "في الطريق" },
    { status: "delivered", label: "تم التسليم" },
  ]

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="متابعة المشتريات" title="طلباتي" description="تابع حالة الطلب والتسليم والسداد في مكان واحد." action={<span className="count-badge">{pharmacyOrders.length} طلبات</span>} />
      <div className="pharmacy-order-filters" role="group" aria-label="تصفية الطلبات">{filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} className={filter === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item.id)}>{item.label}<span>{item.count}</span></button>)}</div>
      <div className="pharmacy-order-list">
        {visibleOrders.map((order) => {
          const expanded = expandedOrder === order.id
          const activeStep = steps.findIndex((step) => step.status === order.orderStatus)
          return <article className="pharmacy-order-card" key={order.id}>
            <div className="pharmacy-order-head"><div><span className="table-id">{order.id}</span><span className="pharmacy-order-date">{formatTime(order.createdAt)}</span></div><OrderStatusPill status={order.orderStatus} /></div>
            <div className="pharmacy-order-info"><div><span>عدد الأصناف</span><strong>{order.items.length}</strong></div><div><span>الإجمالي</span><strong>{formatCurrency(order.total)}</strong></div><div><span>المندوب</span><strong>{order.assignedTo ? agents.find((agent) => agent.id === order.assignedTo)?.name ?? order.assignedTo : "بانتظار الإسناد"}</strong></div></div>
            <div className="pharmacy-order-footer"><div><span>حالة الدفع</span><PaymentStatusPill status={order.paymentStatus} /></div>{order.deliveryStatus && <div><span>حالة التوصيل</span><StatusPill tone={order.deliveryStatus === "delivered" ? "green" : order.deliveryStatus === "failed" ? "red" : "violet"}>{order.deliveryStatus === "on_way" ? "في الطريق" : order.deliveryStatus === "arrived" ? "وصل المندوب" : order.deliveryStatus === "delivered" ? "تم التسليم" : order.deliveryStatus === "failed" ? "تعذر التسليم" : "تم الإسناد"}</StatusPill></div>}</div>
            <button type="button" className="order-detail-toggle" aria-expanded={expanded} aria-controls={`order-details-${order.id}`} onClick={() => setExpandedOrder(expanded ? null : order.id)}>{expanded ? "إخفاء التفاصيل" : "تفاصيل الطلب"}<ChevronDown aria-hidden="true" /></button>
            <div className="pharmacy-order-details" id={`order-details-${order.id}`} hidden={!expanded}>
              {activeStep >= 0 && <ol className="order-progress" aria-label="التقدم الحالي للطلب">{steps.map((step, index) => <li key={step.status} className={index < activeStep ? "order-progress-step complete" : index === activeStep ? "order-progress-step current" : "order-progress-step"}><span>{index < activeStep ? <CheckCircle2 aria-hidden="true" /> : index + 1}</span><small>{step.label}</small></li>)}</ol>}
              {(order.orderStatus === "rejected" || order.orderStatus === "cancelled" || order.deliveryStatus === "failed") && <div className="order-attention-note">{order.rejectionReason ?? (order.orderStatus === "cancelled" ? "تم إلغاء الطلب." : "تعذر التسليم ويحتاج الطلب إلى متابعة.")}</div>}
              <div className="order-detail-grid"><div><span>المستلم</span><strong>{order.recipientName ?? "مسؤول الصيدلية"}</strong></div><div><span>رقم التواصل</span><strong dir="ltr">{order.pharmacyPhone}</strong></div><div className="order-detail-wide"><span>عنوان التسليم</span><strong>{order.deliveryAddress ?? order.region}</strong></div>{order.requestedDeliveryWindow && <div><span>الفترة المناسبة</span><strong>{order.requestedDeliveryWindow}</strong></div>}</div>
              <div className="pharmacy-order-items"><strong>الأصناف</strong>{order.items.map((item) => <div className="pharmacy-order-item" key={item.productId}><span>{item.name} · {item.quantity} وحدة</span><strong>{formatCurrency(item.quantity * item.unitPrice)}</strong></div>)}</div>
              {order.note && <p className="order-customer-note">ملاحظة: {order.note}</p>}
              <div className="order-detail-actions">{order.orderStatus === "pending" && <button type="button" className="danger-text-button" onClick={() => onCancel(order.id)}>إلغاء الطلب</button>}<button type="button" className="text-action" onClick={() => onReorder(order.id)}>إعادة الطلب <RotateCcw aria-hidden="true" /></button></div>
            </div>
          </article>
        })}
        {visibleOrders.length === 0 && <div className="table-empty">لا توجد طلبات ضمن هذا التصنيف.</div>}
      </div>
    </div>
  )
}

export function PharmacyInvoices({ invoices, orders }: { invoices: Invoice[]; orders: Order[] }) {
  const pharmacyInvoices = invoices
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="الحسابات" title="فواتيري" description="راجع تفاصيل كل فاتورة والمبلغ المسدد والمتبقي." />
      {pharmacyInvoices.map((invoice) => {
        const remaining = Math.max(invoice.total - invoice.paidAmount, 0)
        const order = orders.find((item) => item.id === invoice.orderId)
        return <article className="pharmacy-invoice-card" key={invoice.id}>
          <div className="invoice-icon"><ArrowUpLeft aria-hidden="true" /></div>
          <div className="invoice-main"><strong>{invoice.id}</strong><small>{invoice.orderId} · {formatTime(invoice.issuedAt)}</small></div>
          <div className="invoice-amount"><strong>{formatCurrency(invoice.total)}</strong><small>الإجمالي</small></div>
          <div className="invoice-amount"><strong>{formatCurrency(remaining)}</strong><small>متبقي</small></div>
          <PaymentStatusPill status={remaining === 0 ? "paid" : invoice.paidAmount ? "partially_paid" : "unpaid"} />
          <details className="invoice-details">
            <summary>تفاصيل الفاتورة <ArrowDownLeft aria-hidden="true" /></summary>
            {order ? <div className="invoice-line-list">{order.items.map((item) => <div className="pharmacy-order-item" key={item.productId}><span>{item.name} · {item.quantity} وحدة</span><strong>{formatCurrency(item.quantity * item.unitPrice)}</strong></div>)}<div className="invoice-line-total"><span>طريقة السداد</span><strong>{invoice.paymentMethod}</strong></div><div className="invoice-line-total"><span>المسدّد</span><strong>{formatCurrency(invoice.paidAmount)}</strong></div></div> : <p className="invoice-detail-note">تفاصيل الأصناف غير متاحة في بيانات العرض.</p>}
          </details>
        </article>
      })}
      {pharmacyInvoices.length === 0 && <div className="table-empty">لا توجد فواتير بعد.</div>}
    </div>
  )
}

export function PharmacyAccount({ pharmacy, outstandingBalance, onNavigate }: {
  pharmacy: Pharmacy
  outstandingBalance: number
  onNavigate: (tab: PharmacyDestination) => void
}) {
  const accountStatus = pharmacy.status === "approved" ? "مفعّل" : pharmacy.status === "pending" ? "بانتظار المراجعة" : "موقوف"
  const accountTone = pharmacy.status === "approved" ? "green" : pharmacy.status === "pending" ? "amber" : "red"

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="ملف العميل" title="حساب الصيدلية" description="بيانات تجريبية لحساب الصيدلية." action={<button className="subtle-button" onClick={() => onNavigate("invoices")}>عرض الفواتير <ArrowLeft aria-hidden="true" /></button>} />
      <div className="pharmacy-account-grid">
        <SectionCard title="بيانات الصيدلية" description="معلومات توضيحية لحساب العرض التجريبي.">
          <dl className="account-detail-list">
            <div><dt>اسم الصيدلية</dt><dd>{pharmacy.name}</dd></div>
            <div><dt>جهة التواصل</dt><dd>{pharmacy.contact}</dd></div>
            <div><dt>المنطقة</dt><dd><MapPin aria-hidden="true" /> {pharmacy.region}</dd></div>
            <div><dt>الترخيص</dt><dd>{pharmacy.license}</dd></div>
            <div><dt>حالة الحساب</dt><dd><StatusPill tone={accountTone}>{accountStatus}</StatusPill></dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="ملخص الحساب" description="ملخص توضيحي للطلبات والفواتير.">
          <div className="account-balance-panel"><span><Wallet aria-hidden="true" /></span><div><small>الرصيد المستحق</small><strong>{formatCurrency(outstandingBalance)}</strong></div></div>
          <div className="account-note"><CheckCircle2 aria-hidden="true" /><p>بيانات توضيحية لحساب الصيدلية. الطلبات والأسعار المعروضة مخصصة للنسخة التجريبية.</p></div>
          <button className="primary-button account-catalog-action" onClick={() => onNavigate("catalog")}>متابعة التسوق <ArrowLeft aria-hidden="true" /></button>
        </SectionCard>
      </div>
    </div>
  )
}

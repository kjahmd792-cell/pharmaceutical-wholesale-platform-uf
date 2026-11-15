"use client"

import { useMemo, useState } from "react"
import { ClipboardList, CircleDollarSign, Download, Package, Store, TrendingUp } from "lucide-react"
import { formatCurrency, MetricCard, OrderStatusPill, SectionCard, SectionHeading } from "./shared"
import type { Invoice, Order, Product } from "./types"

const statusLabels: Record<Order["orderStatus"], string> = {
  pending: "بانتظار المراجعة",
  accepted: "تم الاعتماد",
  preparing: "قيد التجهيز",
  ready: "جاهز للإسناد",
  out_for_delivery: "في التوصيل",
  delivered: "مكتمل",
  rejected: "مرفوض",
  cancelled: "ملغى",
}

function csvCell(value: string | number) {
  const text = String(value)
  const safeText = /^[\s]*[=+@\-\t\r]/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

export function ReportsView({ orders, invoices, products }: { orders: Order[]; invoices: Invoice[]; products: Product[] }) {
  const [range, setRange] = useState("30")
  const filteredOrders = useMemo(() => {
    if (range === "all") return orders
    const start = new Date()
    start.setDate(start.getDate() - Number(range))
    return orders.filter((order) => new Date(order.createdAt) >= start)
  }, [orders, range])

  const deliveredOrders = filteredOrders.filter((order) => order.orderStatus === "delivered")
  const sales = deliveredOrders.reduce((sum, order) => sum + order.total, 0)
  const collected = filteredOrders.reduce((sum, order) => sum + order.paidAmount, 0)
  const outstanding = filteredOrders.reduce((sum, order) => sum + Math.max(order.total - order.paidAmount, 0), 0)
  const periodInvoices = invoices.filter((invoice) => filteredOrders.some((order) => order.id === invoice.orderId))
  const statusCounts = Object.keys(statusLabels).map((status) => ({
    status: status as Order["orderStatus"],
    label: statusLabels[status as Order["orderStatus"]],
    count: filteredOrders.filter((order) => order.orderStatus === status).length,
  }))
  const largestStatusCount = Math.max(1, ...statusCounts.map((item) => item.count))
  const pharmacySales = Array.from(deliveredOrders.reduce((totals, order) => totals.set(order.pharmacy, (totals.get(order.pharmacy) ?? 0) + order.total), new Map<string, number>()).entries())
    .map(([name, total]) => ({ name, total }))
    .sort((left, right) => right.total - left.total)
    .slice(0, 5)
  const productUnits = filteredOrders.flatMap((order) => order.items).reduce((totals, item) => totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity), new Map<string, number>())
  const productDemand = Array.from(productUnits.entries())
    .map(([productId, units]) => ({ product: products.find((item) => item.id === productId), units }))
    .filter((item): item is { product: Product; units: number } => Boolean(item.product))
    .sort((left, right) => right.units - left.units)
    .slice(0, 5)
  const maxProductUnits = Math.max(1, ...productDemand.map((item) => item.units))

  function exportCsv() {
    const headers = ["رقم الطلب", "الصيدلية", "المنطقة", "تاريخ الإنشاء", "حالة الطلب", "الإجمالي", "المدفوع", "المتبقي", "حالة التوصيل"]
    const rows = filteredOrders.map((order) => [
      order.id,
      order.pharmacy,
      order.region,
      new Date(order.createdAt).toISOString(),
      statusLabels[order.orderStatus],
      order.total.toFixed(2),
      order.paidAmount.toFixed(2),
      Math.max(order.total - order.paidAmount, 0).toFixed(2),
      order.deliveryStatus ?? "غير مسند",
    ])
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `تقرير-الطلبات-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="تحليلات العمليات"
        title="التقارير"
        description="ملخص حركة الطلبات والتحصيل وأصناف التوزيع ضمن الفترة المختارة."
        action={<div className="report-toolbar"><label className="report-range"><span>الفترة</span><select value={range} onChange={(event) => setRange(event.target.value)} aria-label="الفترة الزمنية للتقرير"><option value="7">آخر 7 أيام</option><option value="30">آخر 30 يومًا</option><option value="all">كل الفترات</option></select></label><button className="primary-button" type="button" onClick={exportCsv} disabled={filteredOrders.length === 0}><Download aria-hidden="true" /> تصدير CSV</button></div>}
      />

      <div className="metric-grid">
        <MetricCard label="الطلبات في الفترة" value={String(filteredOrders.length)} hint="حسب تاريخ إنشاء الطلب" icon={ClipboardList} tone="blue" />
        <MetricCard label="مبيعات الطلبات المكتملة" value={formatCurrency(sales)} hint={`${deliveredOrders.length} طلبات مكتملة`} icon={CircleDollarSign} tone="teal" />
        <MetricCard label="المبالغ المحصلة" value={formatCurrency(collected)} hint={`${periodInvoices.length} فواتير مرتبطة`} icon={TrendingUp} tone="violet" />
        <MetricCard label="الرصيد المستحق" value={formatCurrency(outstanding)} hint="من طلبات الفترة" icon={Store} tone="amber" />
      </div>

      <div className="report-grid">
        <SectionCard title="حالة الطلبات" description="عدد الطلبات ضمن الفترة المحددة.">
          <div className="report-status-list">
            {statusCounts.map((item) => <div className="report-bar-row" key={item.status}><div className="report-bar-label"><span><OrderStatusPill status={item.status} /></span><strong>{item.count}</strong></div><div className="report-bar-track"><span className="report-bar-fill" style={{ width: `${Math.max((item.count / largestStatusCount) * 100, item.count ? 8 : 0)}%` }} /></div></div>)}
          </div>
        </SectionCard>

        <SectionCard title="أعلى الصيدليات مبيعًا" description="إجمالي الطلبات المكتملة في الفترة.">
          {pharmacySales.length ? <ol className="report-ranking-list">{pharmacySales.map((item, index) => <li key={item.name}><span className="report-rank">{index + 1}</span><span className="report-rank-name">{item.name}</span><strong>{formatCurrency(item.total)}</strong></li>)}</ol> : <p className="table-empty">لا توجد طلبات مكتملة في الفترة.</p>}
        </SectionCard>

        <SectionCard title="الأصناف الأكثر طلبًا" description="الوحدات المطلوبة حسب سجل الطلبات.">
          {productDemand.length ? <div className="report-status-list">{productDemand.map((item) => <div className="report-bar-row" key={item.product.id}><div className="report-bar-label"><span>{item.product.name}</span><strong>{item.units} وحدة</strong></div><div className="report-bar-track"><span className="report-bar-fill report-bar-fill-alt" style={{ width: `${Math.max((item.units / maxProductUnits) * 100, 8)}%` }} /></div></div>)}</div> : <p className="table-empty">لا توجد بيانات طلبات في الفترة.</p>}
        </SectionCard>

        <SectionCard title="ملخص الفواتير" description="الفواتير المرتبطة بطلبات الفترة المختارة.">
          <div className="report-invoice-summary"><span className="report-invoice-icon"><Package aria-hidden="true" /></span><div><strong>{periodInvoices.length} فاتورة</strong><small>إجمالي الفواتير {formatCurrency(periodInvoices.reduce((sum, invoice) => sum + invoice.total, 0))}</small></div></div>
          <div className="report-invoice-summary"><span className="report-invoice-icon report-invoice-icon-muted"><CircleDollarSign aria-hidden="true" /></span><div><strong>{formatCurrency(periodInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0))}</strong><small>مبالغ مسجلة على الفواتير</small></div></div>
          <p className="report-footnote">التقرير محسوب من الطلبات والفواتير المحفوظة لشركتك.</p>
        </SectionCard>
      </div>
    </div>
  )
}

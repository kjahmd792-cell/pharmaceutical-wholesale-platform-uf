"use client"

import { useMemo, useState } from "react"
import { Check, Clock3, MapPin, Phone, Truck, UserRound } from "lucide-react"
import { DeliveryProgress, formatCurrency, formatTime, OrderStatusPill, SectionHeading, StatusPill } from "./shared"
import type { DeliveryAgent, Order } from "./types"

type DispatchFilter = "ready" | "active" | "failed" | "delivered"

const filterLabels: Array<{ id: DispatchFilter; label: string }> = [
  { id: "ready", label: "جاهزة للإسناد" },
  { id: "active", label: "قيد التوصيل" },
  { id: "failed", label: "تعذر التسليم" },
  { id: "delivered", label: "تم التسليم" },
]

export function CompanyDispatchView({
  orders,
  agents,
  onAssign,
}: {
  orders: Order[]
  agents: DeliveryAgent[]
  onAssign: (orderId: string, agentId: string) => void
}) {
  const [filter, setFilter] = useState<DispatchFilter>("ready")
  const [query, setQuery] = useState("")
  const [selectedAgents, setSelectedAgents] = useState<Record<string, string>>({})

  const counts: Record<DispatchFilter, number> = {
    ready: orders.filter((order) => order.orderStatus === "ready" && order.deliveryStatus === null).length,
    active: orders.filter((order) => ["assigned", "on_way", "arrived"].includes(order.deliveryStatus ?? "")).length,
    failed: orders.filter((order) => order.deliveryStatus === "failed").length,
    delivered: orders.filter((order) => order.deliveryStatus === "delivered").length,
  }

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.pharmacy} ${order.region} ${order.assignedTo ?? ""}`.includes(query.trim())
    const matchesFilter = filter === "ready"
      ? order.orderStatus === "ready" && order.deliveryStatus === null
      : filter === "active"
        ? ["assigned", "on_way", "arrived"].includes(order.deliveryStatus ?? "")
        : filter === "failed"
          ? order.deliveryStatus === "failed"
          : order.deliveryStatus === "delivered"
    return matchesQuery && matchesFilter
  }), [orders, query, filter])

  const activeAgents = agents.filter((agent) => agent.status !== "offline")

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="إدارة التوصيل"
        title="الإسناد والتوصيل"
        description="وزّع الطلبات الجاهزة على المندوبين، وتابع الحالات والاستثناءات من مكان واحد."
        action={<span className="count-badge"><UserRound aria-hidden="true" /> {activeAgents.length} مندوبين متاحين</span>}
      />

      <div className="summary-strip">
        <div><span>جاهزة للإسناد</span><strong>{counts.ready}</strong></div>
        <div><span>قيد التوصيل</span><strong>{counts.active}</strong></div>
        <div><span>تعذر التسليم</span><strong>{counts.failed}</strong></div>
        <div><span>تم التسليم</span><strong>{counts.delivered}</strong></div>
      </div>

      <section className="section-card" aria-label="قائمة عمليات التوصيل">
        <div className="section-card-head dispatch-heading">
          <div><h3>متابعة الطلبات</h3><p>الإسناد يحدّث قائمة المندوب وحالة الطلب المسجلة.</p></div>
          <label className="search-control"><span className="sr-only">بحث في التوصيل</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الطلب أو الصيدلية" /></label>
        </div>
        <div className="filter-row" role="tablist" aria-label="تصفية التوصيلات">
          {filterLabels.map((item) => <button key={item.id} role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item.id)}>{item.label}<span className="dispatch-filter-count">{counts[item.id]}</span></button>)}
        </div>

        <div className="dispatch-list">
          {visibleOrders.map((order) => {
            const selectedAgent = selectedAgents[order.id] ?? order.assignedTo ?? activeAgents[0]?.id ?? ""
            const canAssign = filter === "ready" || filter === "failed" || order.deliveryStatus === "assigned"
            const agent = agents.find((item) => item.id === order.assignedTo)
            return (
              <article className="dispatch-card" key={order.id}>
                <div className="dispatch-card-head">
                  <div className="dispatch-order-title"><span className="table-id">{order.id}</span><small>{formatTime(order.createdAt)}</small></div>
                  <div className="dispatch-badges"><OrderStatusPill status={order.orderStatus} />{order.deliveryStatus === "failed" ? <StatusPill tone="red">تعذر التسليم</StatusPill> : order.deliveryStatus && <StatusPill tone={order.deliveryStatus === "delivered" ? "green" : "violet"}>{order.deliveryStatus === "delivered" ? "تم التسليم" : order.deliveryStatus === "assigned" ? "تم الإسناد" : order.deliveryStatus === "on_way" ? "في الطريق" : "وصل المندوب"}</StatusPill>}</div>
                </div>

                <div className="dispatch-details">
                  <div><span>الصيدلية</span><strong>{order.pharmacy}</strong><small><MapPin aria-hidden="true" /> {order.deliveryAddress || order.region}</small></div>
                  <div><span>الفاتورة</span><strong>{formatCurrency(order.total)}</strong><small>{order.items.length} أصناف · {order.items.reduce((sum, item) => sum + item.quantity, 0)} وحدة</small></div>
                  <div><span>التواصل</span><span className="dispatch-phone"><Phone aria-hidden="true" /> {order.pharmacyPhone}</span><small>المطلوب تحصيله: {formatCurrency(Math.max(order.total - order.paidAmount, 0))}</small></div>
                </div>

                {order.deliveryStatus && order.deliveryStatus !== "failed" && <DeliveryProgress status={order.deliveryStatus} />}
                {order.deliveryStatus === "failed" && <div className="dispatch-exception"><strong>تعذر التسليم</strong><span>{order.rejectionReason ?? "لم يُسجل سبب إضافي."}</span></div>}

                {order.deliveryStatus === "delivered" && order.deliveryProof && <div className="dispatch-proof"><Check aria-hidden="true" /><span>استلمها {order.deliveryProof.recipient} · {formatTime(order.deliveryProof.deliveredAt)}</span><strong>حُصّل {formatCurrency(order.deliveryProof.collectedAmount)}</strong></div>}

                <div className="dispatch-card-foot">
                  <div className="dispatch-agent-summary">
                    <span className="dispatch-agent-icon"><Truck aria-hidden="true" /></span>
                    <div><small>{order.assignedTo ? "المندوب المسند" : "لم يُسند بعد"}</small><strong>{agent?.name ?? order.assignedTo ?? "بانتظار الإسناد"}</strong></div>
                    {agent && <span className="dispatch-agent-region">{agent.region}</span>}
                  </div>
                  {canAssign && <div className="dispatch-assign-controls">
                    <label className="sr-only" htmlFor={`agent-${order.id}`}>اختيار مندوب للطلب {order.id}</label>
                    <select id={`agent-${order.id}`} value={selectedAgent} disabled={activeAgents.length === 0} onChange={(event) => setSelectedAgents((current) => ({ ...current, [order.id]: event.target.value }))}>
                      {activeAgents.length === 0 ? <option value="">لا يوجد مندوب متاح</option> : activeAgents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <button className="primary-button" disabled={!selectedAgent} onClick={() => onAssign(order.id, selectedAgent)}><Truck aria-hidden="true" />{order.deliveryStatus === "failed" ? "إعادة الإسناد" : order.deliveryStatus === "assigned" ? "تغيير المندوب" : "إسناد للمندوب"}</button>
                  </div>}
                  {!canAssign && order.deliveryStatus !== "delivered" && <div className="dispatch-agent-state"><Clock3 aria-hidden="true" /> جارٍ التوصيل</div>}
                </div>
              </article>
            )
          })}
          {visibleOrders.length === 0 && <div className="dispatch-empty"><span className="empty-icon"><Truck aria-hidden="true" /></span><strong>لا توجد طلبات في هذا القسم</strong><p>ستظهر الطلبات هنا عند تغيّر حالتها.</p></div>}
        </div>
      </section>
    </div>
  )
}

import type { LucideIcon } from "lucide-react"
import { Check, CircleAlert, Clock3, Truck } from "lucide-react"
import type { DeliveryStatus, OrderStatus, PaymentStatus } from "./types"

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount)

export const formatTime = (value: string) =>
  new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(value))

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "قيد المراجعة",
  accepted: "مقبول",
  preparing: "قيد التجهيز",
  ready: "جاهز للتوصيل",
  out_for_delivery: "خرج للتوصيل",
  delivered: "تم التسليم",
  rejected: "مرفوض",
  cancelled: "ملغي",
}

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  assigned: "تم الإسناد",
  on_way: "في الطريق",
  arrived: "وصل المندوب",
  delivered: "تم التسليم",
  failed: "تعذر التسليم",
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "غير مدفوع",
  partially_paid: "مدفوع جزئيًا",
  paid: "مدفوع",
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const tones: Record<OrderStatus, string> = {
    pending: "amber",
    accepted: "blue",
    preparing: "blue",
    ready: "teal",
    out_for_delivery: "violet",
    delivered: "green",
    rejected: "red",
    cancelled: "neutral",
  }
  return <StatusPill tone={tones[status]}>{orderStatusLabels[status]}</StatusPill>
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const tone = status === "paid" ? "green" : status === "partially_paid" ? "amber" : "neutral"
  return <StatusPill tone={tone}>{paymentStatusLabels[status]}</StatusPill>
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "teal",
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone?: string
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon aria-hidden="true" /></div>
      <div className="metric-copy">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <span className="metric-hint">{hint}</span>
      </div>
    </article>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-heading-action">{action}</div>}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`section-card ${className}`}>
      <div className="section-card-head">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = CircleAlert,
}: {
  title: string
  description: string
  icon?: LucideIcon
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export function DeliveryProgress({ status }: { status: DeliveryStatus | null }) {
  const steps: Array<{ id: DeliveryStatus; label: string; icon: LucideIcon }> = [
    { id: "assigned", label: "استلام", icon: Check },
    { id: "on_way", label: "في الطريق", icon: Truck },
    { id: "arrived", label: "الوصول", icon: Clock3 },
  ]
  const activeIndex = steps.findIndex((step) => step.id === status)
  return (
    <ol className="delivery-progress" aria-label="مراحل التوصيل">
      {steps.map((step, index) => {
        const StepIcon = step.icon
        const complete = status === "delivered" || (activeIndex !== -1 && index <= activeIndex)
        return (
          <li className={complete ? "progress-step complete" : "progress-step"} key={step.id}>
            <span><StepIcon aria-hidden="true" /></span>
            <small>{step.label}</small>
          </li>
        )
      })}
    </ol>
  )
}

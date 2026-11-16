"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, BellRing, Check, CheckCircle2, Copy, KeyRound, ShieldCheck, Truck, X } from "lucide-react"
import { clearOtpHistory, markOtpsSeen, useDeliveryOtps, type DeliveryOtp } from "./otp-store"
import { formatCurrency } from "./shared"

function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function countdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

function timeAgo(timestamp: number, now: number) {
  const minutes = Math.floor((now - timestamp) / 60000)
  if (minutes < 1) return "الآن"
  if (minutes < 60) return `منذ ${minutes} د`
  return `منذ ${Math.floor(minutes / 60)} س`
}

function usePharmacyOtps(pharmacyName: string) {
  const otps = useDeliveryOtps()
  const now = useNow()
  const mine = otps.filter((otp) => otp.pharmacy === pharmacyName)
  const active = mine.filter((otp) => otp.status === "pending" && otp.expiresAt > now)
  return { mine, active, now }
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="otp-copy" onClick={() => { void navigator.clipboard?.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600) }}>
    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "تم النسخ" : "نسخ الرمز"}
  </button>
}

export function PharmacyOtpBell({ pharmacyName }: { pharmacyName: string }) {
  const { mine, active, now } = usePharmacyOtps(pharmacyName)
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const unseen = mine.filter((otp) => !otp.seen && otp.status === "pending").length

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey) }
  }, [open])

  function toggle() {
    setOpen((value) => !value)
    markOtpsSeen(mine.map((otp) => otp.orderId))
  }

  return (
    <div className="notify-wrapper" ref={wrapper}>
      <button type="button" className={active.length ? "notify-bell ringing" : "notify-bell"} aria-expanded={open} aria-haspopup="dialog" aria-label={`الإشعارات${unseen ? `، ${unseen} جديدة` : ""}`} onClick={toggle}>
        {active.length ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}
        {unseen > 0 && <span className="notify-count">{unseen}</span>}
      </button>
      {open && <div className="notify-panel" role="dialog" aria-label="إشعارات الصيدلية">
        <div className="notify-panel-head"><strong>الإشعارات</strong>{mine.some((otp) => otp.status === "verified") && <button type="button" onClick={() => clearOtpHistory(pharmacyName)}>مسح السجل</button>}</div>
        {mine.length === 0 ? <div className="notify-empty"><Bell aria-hidden="true" /><span>لا توجد إشعارات بعد</span><small>ستصلك رموز تأكيد التسليم هنا عند وصول المندوب.</small></div> : <ul className="notify-list">
          {mine.map((otp) => <NotificationItem key={`${otp.orderId}-${otp.sentAt}`} otp={otp} now={now} />)}
        </ul>}
      </div>}
    </div>
  )
}

function NotificationItem({ otp, now }: { otp: DeliveryOtp; now: number }) {
  const expired = otp.status === "pending" && otp.expiresAt <= now
  const verified = otp.status === "verified"
  return <li className={verified ? "notify-item verified" : expired ? "notify-item expired" : "notify-item"}>
    <span className="notify-item-icon">{verified ? <CheckCircle2 aria-hidden="true" /> : <KeyRound aria-hidden="true" />}</span>
    <div>
      <strong>{verified ? `تم تأكيد استلام ${otp.orderId}` : `رمز تأكيد استلام ${otp.orderId}`}</strong>
      <small>{verified ? `أكد ${otp.driverName} التسليم بنجاح` : `المندوب ${otp.driverName} بانتظار الرمز`} · {timeAgo(otp.sentAt, now)}</small>
      {!verified && <span className={expired ? "notify-code muted" : "notify-code"} dir="ltr">{expired ? "منتهي الصلاحية" : otp.code.split("").join(" ")}</span>}
    </div>
  </li>
}

export function PharmacyOtpAlerts({ pharmacyName }: { pharmacyName: string }) {
  const { mine, active, now } = usePharmacyOtps(pharmacyName)
  const toast = mine.find((otp) => !otp.seen && otp.status === "pending" && otp.expiresAt > now)
  const recentlyVerified = mine.find((otp) => otp.status === "verified" && otp.verifiedAt && now - otp.verifiedAt < 60000)

  return (
    <>
      {active.map((otp) => (
        <section key={otp.orderId} className="otp-banner" aria-labelledby={`otp-banner-${otp.orderId}`}>
          <div className="otp-banner-pulse" aria-hidden="true"><Truck /></div>
          <div className="otp-banner-copy">
            <span className="otp-banner-eyebrow"><BellRing aria-hidden="true" /> إشعار تأكيد التسليم</span>
            <h2 id={`otp-banner-${otp.orderId}`}>المندوب {otp.driverName} وصل لتسليم الطلب {otp.orderId}</h2>
            <p>{otp.itemsCount} أصناف · {formatCurrency(otp.total)} — أعطِ هذا الرمز للمندوب فقط بعد استلام الطلب ومراجعته.</p>
          </div>
          <div className="otp-banner-code">
            <small>رمز التحقق</small>
            <div className="otp-code-digits" dir="ltr" aria-label={`رمز التحقق ${otp.code.split("").join(" ")}`}>
              {otp.code.split("").map((digit, index) => <span key={index}>{digit}</span>)}
            </div>
            <div className="otp-banner-meta"><span className={otp.expiresAt - now < 60000 ? "otp-timer otp-timer-warn" : "otp-timer"}>ينتهي خلال {countdown(otp.expiresAt - now)}</span><CopyCodeButton code={otp.code} /></div>
          </div>
        </section>
      ))}

      {recentlyVerified && !active.length && <div className="otp-verified-banner" role="status"><ShieldCheck aria-hidden="true" /><span>تم تأكيد استلام الطلب <b>{recentlyVerified.orderId}</b> بواسطة {recentlyVerified.driverName} باستخدام رمز التحقق.</span></div>}

      {toast && <div className="otp-toast" role="alert">
        <span className="otp-toast-icon"><BellRing aria-hidden="true" /></span>
        <div><strong>رمز تأكيد استلام جديد</strong><small>{toast.driverName} · {toast.orderId}</small><span className="otp-toast-code" dir="ltr">{toast.code}</span></div>
        <button type="button" onClick={() => markOtpsSeen([toast.orderId])} aria-label="إغلاق الإشعار"><X aria-hidden="true" /></button>
      </div>}
    </>
  )
}

import { KeyRound, ShieldCheck, Users } from "lucide-react"
import { SectionCard, SectionHeading, StatusPill } from "./shared"

const members = [
  { name: "ماجد العتيبي", email: "owner@demo.local", role: "مالك الشركة", initials: "م", tone: "teal" },
  { name: "ريم الحربي", email: "stock@demo.local", role: "مسؤول المخزون", initials: "ر", tone: "blue" },
  { name: "خالد الدوسري", email: "orders@demo.local", role: "مسؤول الطلبات", initials: "خ", tone: "amber" },
  { name: "سارة المطيري", email: "dispatch@demo.local", role: "مسؤولة التوصيل", initials: "س", tone: "violet" },
]

const permissions = [
  { role: "مالك الشركة", detail: "عرض جميع الأقسام ومراجعة مؤشرات الأداء." },
  { role: "مسؤول المخزون", detail: "متابعة المنتجات والكميات والتنبيهات." },
  { role: "مسؤول الطلبات", detail: "مراجعة الطلبات والصيدليات والفواتير." },
  { role: "مسؤول التوصيل", detail: "إسناد الطلبات ومتابعة مسارات التوصيل." },
]

export function CompanyTeamView() {
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="مساحة واحدة" title="فريق الشركة" description="أدوار عرض توضيحية داخل مساحة شركة واحدة، دون إنشاء حسابات أو دعوات فعلية." action={<StatusPill tone="amber">نسخة تجريبية</StatusPill>} />
      <div className="dashboard-grid">
        <SectionCard title="أعضاء الفريق" description="بيانات تجريبية لإظهار شكل إدارة الوصول." action={<span className="count-badge"><Users aria-hidden="true" /> 4 أعضاء</span>}>
          <ul className="member-list">{members.map((member) => <li className="member-row" key={member.email}><span className={`member-avatar tone-${member.tone}`} aria-hidden="true">{member.initials}</span><span className="member-info"><strong>{member.name}</strong><small dir="ltr">{member.email}</small></span><span className="member-role">{member.role}</span></li>)}</ul>
          <button className="subtle-button" type="button" disabled><KeyRound aria-hidden="true" /> دعوة عضو · قيد التطوير</button>
        </SectionCard>
        <SectionCard title="الصلاحيات المقترحة" description="تفاصيل الأدوار ظاهرة للعرض فقط." action={<ShieldCheck aria-hidden="true" className="section-head-icon" />}>
          <ul className="permission-list">{permissions.map((item) => <li key={item.role}><strong>{item.role}</strong><span>{item.detail}</span></li>)}</ul>
          <div className="feature-note"><ShieldCheck aria-hidden="true" /><span>تطبيق الصلاحيات الفعلية قيد التطوير.</span></div>
        </SectionCard>
      </div>
    </div>
  )
}

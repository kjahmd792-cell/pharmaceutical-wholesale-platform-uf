import Link from "next/link"
import { ArrowLeft, ArrowUpLeft, Boxes, ClipboardList, LayoutDashboard, Store, Truck, UserRound } from "lucide-react"

const demoAccounts = [
  { role: "owner", name: "مالك الشركة", subtitle: "لوحة كاملة لإدارة العمليات", email: "owner@demo.local", icon: LayoutDashboard, href: "/company?role=owner", tone: "teal" },
  { role: "inventory", name: "مسؤول المخزون", subtitle: "المنتجات والكميات والتنبيهات", email: "stock@demo.local", icon: Boxes, href: "/company?role=inventory", tone: "blue" },
  { role: "orders", name: "مسؤول الطلبات", subtitle: "الطلبات والصيدليات والفواتير", email: "orders@demo.local", icon: ClipboardList, href: "/company?role=orders", tone: "amber" },
  { role: "dispatcher", name: "مسؤول التوصيل", subtitle: "توزيع المسارات ومتابعة السائقين", email: "dispatch@demo.local", icon: Truck, href: "/company?role=dispatcher", tone: "violet" },
  { role: "driver", name: "مندوب التوصيل", subtitle: "مسار اليوم وإثبات التسليم", email: "driver@demo.local", icon: Truck, href: "/driver", tone: "green" },
  { role: "pharmacy", name: "حساب الصيدلية", subtitle: "الكتالوج والسلة ومتابعة الطلبات", email: "pharmacy@demo.local", icon: Store, href: "/pharmacy", tone: "rose" },
]

export function CompanyDemoSignIn() {
  return (
    <main className="demo-login-page" dir="rtl">
      <div className="demo-login-shell">
        <header className="demo-login-header">
          <Link className="brand demo-login-brand" href="/" aria-label="الشاعر للتوزيع الدوائي، الصفحة الرئيسية">
            <span className="brand-mark"><Store aria-hidden="true" /></span><span className="brand-copy"><strong>الشاعر</strong><small>للتوزيع الدوائي</small></span>
          </Link>
          <Link className="demo-return-link demo-return-light" href="/">العودة إلى لوحة العرض <ArrowUpLeft aria-hidden="true" /></Link>
        </header>

        <section className="demo-login-intro" aria-labelledby="demo-login-title">
          <span className="demo-login-kicker"><UserRound aria-hidden="true" /> دخول العرض التجريبي</span>
          <h1 id="demo-login-title">اختر الحساب الذي تريد عرضه</h1>
          <p>شركة واحدة، وأدوار مختلفة لتجربة الواجهات. لا تحتاج إلى إنشاء حساب أو إدخال كلمة مرور.</p>
          <span className="demo-only-badge">بيانات توضيحية · لا يتم حفظ أي تغيير</span>
        </section>

        <section className="demo-account-grid" aria-label="الحسابات التجريبية">
          {demoAccounts.map((account) => {
            const Icon = account.icon
            return <article className="demo-account-card" key={account.role}>
              <div className={`demo-account-icon tone-${account.tone}`}><Icon aria-hidden="true" /></div>
              <div className="demo-account-copy"><h2>{account.name}</h2><p>{account.subtitle}</p></div>
              <span className="demo-account-email" dir="ltr">{account.email}</span>
              <Link className="demo-account-action" href={account.href}>دخول سريع <ArrowLeft aria-hidden="true" /></Link>
            </article>
          })}
        </section>

        <footer className="demo-login-footer"><span>عرض تجريبي لشركة واحدة</span><span>الحسابات والبيانات تجريبية فقط</span></footer>
      </div>
    </main>
  )
}

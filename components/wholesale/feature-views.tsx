import { ArrowUpLeft, Building2, Check, CirclePlus, MapPin, Settings2, Tag, Users } from "lucide-react"
import { MetricCard, SectionCard, SectionHeading, StatusPill } from "./shared"

export function BranchesView() {
  const branches = [
    { name: "المركز الرئيسي", location: "شمال الرياض · المستودع المركزي", orders: 18, status: "الفرع الرئيسي" },
    { name: "فرع المنطقة الوسطى", location: "وسط الرياض · نقطة توزيع", orders: 11, status: "قيد التجهيز" },
    { name: "فرع المنطقة الشرقية", location: "الدمام · مركز توزيع", orders: 7, status: "قيد التجهيز" },
  ]

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="شبكة التوزيع" title="الفروع ونقاط التوزيع" description="تصور موحّد للفروع ومناطق التغطية ضمن شركة واحدة." action={<span className="count-badge"><Building2 aria-hidden="true" /> 3 مواقع تجريبية</span>} />
      <div className="metric-grid three-metrics">
        <MetricCard label="مواقع التوزيع" value="03" hint="مركز رئيسي وفرعان" icon={Building2} tone="teal" />
        <MetricCard label="مناطق التغطية" value="12" hint="ضمن نطاق العرض" icon={MapPin} tone="blue" />
        <MetricCard label="الطلبات النشطة" value="36" hint="على شبكة التوزيع" icon={Users} tone="violet" />
      </div>
      <SectionCard title="مواقع الشركة" description="بيانات المواقع توضيحية وليست مرتبطة بخرائط أو عناوين فعلية." action={<button className="subtle-button" type="button" disabled><CirclePlus aria-hidden="true" /> إضافة فرع · قيد التطوير</button>}>
        <div className="feature-card-grid">
          {branches.map((branch, index) => <article className="feature-card" key={branch.name}>
            <div className="feature-card-icon"><Building2 aria-hidden="true" /></div>
            <div className="feature-card-head"><span className="eyebrow">{index === 0 ? "المقر الرئيسي" : `موقع تجريبي 0${index + 1}`}</span><StatusPill tone={index === 0 ? "green" : "amber"}>{branch.status}</StatusPill></div>
            <h3>{branch.name}</h3><p><MapPin aria-hidden="true" /> {branch.location}</p>
            <div className="feature-card-foot"><span>طلبات اليوم</span><strong>{branch.orders}</strong></div>
            <button className="wide-secondary-button" type="button" disabled>إدارة الفرع · قيد التطوير <ArrowUpLeft aria-hidden="true" /></button>
          </article>)}
        </div>
      </SectionCard>
    </div>
  )
}

export function OffersView() {
  const offers = [
    { name: "عرض بداية الشهر", description: "خصم تجريبي على مجموعة منتجات مختارة", code: "START-15", usage: "28 من 50", tone: "teal" },
    { name: "خصم الطلبات الكبيرة", description: "سعر خاص للطلبات فوق حد معين", code: "WHOLESALE-10", usage: "14 من 30", tone: "amber" },
    { name: "عرض العملاء الجدد", description: "حافز ترحيبي للصيدليات الجديدة", code: "WELCOME-25", usage: "9 من 20", tone: "violet" },
  ]

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="نمو المبيعات" title="العروض التجارية" description="استعرض الحملات المقترحة وشاهد أثرها المتوقع على الطلبات." action={<span className="count-badge"><Tag aria-hidden="true" /> بيانات توضيحية</span>} />
      <div className="summary-strip">
        <div><span>العروض النشطة</span><strong>03</strong></div><div><span>استخدامات هذا الشهر</span><strong>51</strong></div><div><span>الصيدليات المشاركة</span><strong>34</strong></div><div><span>مبيعات من العروض</span><strong>١٢٬٤٥٠ ر.س</strong></div>
      </div>
      <SectionCard title="الحملات المقترحة" description="إعداد العروض وربطها بالأسعار الفعلية قيد التطوير." action={<button className="primary-button" type="button" disabled><CirclePlus aria-hidden="true" /> إنشاء عرض · قيد التطوير</button>}>
        <div className="feature-card-grid">
          {offers.map((offer) => <article className="offer-card" key={offer.code}>
            <div className={`offer-card-icon offer-${offer.tone}`}><Tag aria-hidden="true" /></div>
            <span className="offer-code" dir="ltr">{offer.code}</span><h3>{offer.name}</h3><p>{offer.description}</p>
            <div className="offer-progress"><span>معدل الاستخدام</span><strong>{offer.usage}</strong><div className="funnel-track"><span className={`funnel-fill fill-${offer.tone}`} style={{ width: "58%" }} /></div></div>
            <button className="wide-secondary-button" type="button" disabled>تفاصيل الحملة · قيد التطوير <ArrowUpLeft aria-hidden="true" /></button>
          </article>)}
        </div>
      </SectionCard>
    </div>
  )
}

export function SettingsView() {
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="إعدادات المنصة" title="إعدادات الشركة" description="إعدادات موحّدة لشركة واحدة؛ ربط القيم الفعلية قيد التطوير." action={<StatusPill tone="amber">قيد التطوير</StatusPill>} />
      <div className="dashboard-grid">
        <SectionCard title="بيانات الشركة" description="معلومات تعريفية للعرض فقط.">
          <dl className="account-detail-list"><div><dt>اسم الشركة</dt><dd>الشاعر للتوزيع الدوائي</dd></div><div><dt>البريد الإداري</dt><dd dir="ltr">operations@demo.local</dd></div><div><dt>المنطقة الرئيسية</dt><dd>الرياض، المملكة العربية السعودية</dd></div><div><dt>العملة</dt><dd>الريال السعودي · SAR</dd></div></dl>
          <button className="subtle-button" type="button" disabled><Settings2 aria-hidden="true" /> تعديل البيانات · قيد التطوير</button>
        </SectionCard>
        <SectionCard title="تفضيلات التشغيل" description="خيارات مقترحة لنسخة التنفيذ اللاحقة.">
          <ul className="permission-list"><li><strong>التنبيهات</strong><span>إشعار عند وصول طلب جديد أو انخفاض المخزون.</span></li><li><strong>أوقات التسليم</strong><span>إدارة نوافذ التوصيل ومواعيد الاستلام.</span></li><li><strong>سجل النشاط</strong><span>تتبع تغييرات الطلبات والمخزون والصلاحيات.</span></li></ul>
          <button className="primary-button" type="button" disabled><Check aria-hidden="true" /> حفظ التفضيلات · قيد التطوير</button>
        </SectionCard>
      </div>
    </div>
  )
}

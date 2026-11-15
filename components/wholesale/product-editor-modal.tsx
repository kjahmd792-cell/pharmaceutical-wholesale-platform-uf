"use client"

import { useState, type FormEvent } from "react"
import { Plus, X } from "lucide-react"
import type { Product } from "./types"

export function ProductEditorModal({ product, onClose, onSave }: { product?: Product; onClose: () => void; onSave: (product: Product) => void }) {
  const [form, setForm] = useState(() => ({
    name: product?.name ?? "",
    scientificName: product?.scientificName ?? "",
    manufacturer: product?.manufacturer ?? "",
    category: product?.category ?? "",
    pack: product?.pack ?? "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "0",
    expiry: product?.expiry ?? "",
    code: product?.code ?? "",
  }))

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)
    const reserved = product?.reserved ?? 0
    if (!Number.isFinite(price) || price <= 0 || !Number.isSafeInteger(stock) || stock < reserved) return

    onSave({
      id: product?.id ?? "",
      name: form.name.trim(),
      scientificName: form.scientificName.trim(),
      manufacturer: form.manufacturer.trim(),
      category: form.category.trim(),
      pack: form.pack.trim(),
      price,
      stock,
      reserved,
      expiry: form.expiry,
      code: form.code.trim(),
      tag: product?.tag,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="detail-modal product-editor-modal" role="dialog" aria-modal="true" aria-labelledby="product-editor-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div><span className="eyebrow">كتالوج الشركة</span><h2 id="product-editor-title">{product ? "تعديل بيانات المنتج" : "إضافة منتج جديد"}</h2></div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="إغلاق"><X aria-hidden="true" /></button>
        </div>
        <form onSubmit={submitProduct}>
          <div className="product-form-grid">
            <label className="field-label">الاسم التجاري<input required maxLength={120} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="field-label">الاسم العلمي<input required maxLength={120} value={form.scientificName} onChange={(event) => setForm((current) => ({ ...current, scientificName: event.target.value }))} /></label>
            <label className="field-label">الشركة المصنّعة<input required maxLength={120} value={form.manufacturer} onChange={(event) => setForm((current) => ({ ...current, manufacturer: event.target.value }))} /></label>
            <label className="field-label">التصنيف<input required maxLength={60} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></label>
            <label className="field-label">حجم العبوة<input required maxLength={60} value={form.pack} onChange={(event) => setForm((current) => ({ ...current, pack: event.target.value }))} /></label>
            <label className="field-label">الباركود<input required maxLength={64} dir="ltr" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} /></label>
            <label className="field-label">سعر الجملة (ر.س)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} /></label>
            <label className="field-label">رصيد المخزون<input required type="number" min={product?.reserved ?? 0} step="1" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} /></label>
            <label className="field-label">تاريخ الصلاحية<input required type="text" inputMode="numeric" pattern="[0-9]{4}-(0[1-9]|1[0-2])" maxLength={7} placeholder="2027-12" value={form.expiry} onChange={(event) => setForm((current) => ({ ...current, expiry: event.target.value }))} /></label>
          </div>
          <p className="form-hint">تُحفظ التعديلات في كتالوج شركتك، ويُسجل أي تغيير في رصيد المخزون.</p>
          <div className="form-actions"><button type="button" className="subtle-button" onClick={onClose}>إلغاء</button><button type="submit" className="primary-button"><Plus aria-hidden="true" />{product ? "حفظ التعديلات" : "إضافة المنتج"}</button></div>
        </form>
      </section>
    </div>
  )
}

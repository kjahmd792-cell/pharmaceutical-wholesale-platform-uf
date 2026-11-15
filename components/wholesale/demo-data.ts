import type { DeliveryAgent, Invoice, Order, Pharmacy, Product } from "./types"

const now = new Date("2026-11-13T12:00:00.000Z").getTime()
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()

export const demoProducts: Product[] = [
  { id: "MED-1042", name: "مسكن فموي تجريبي", scientificName: "تركيبة توضيحية", manufacturer: "مصنع الشاعر التجريبي", category: "أقراص", pack: "علبة · 20 قرصًا", price: 42, stock: 186, reserved: 24, expiry: "2027-08", code: "62800001042", tag: "الأكثر طلبًا" },
  { id: "MED-1187", name: "شراب أطفال تجريبي", scientificName: "تركيبة توضيحية", manufacturer: "مصنع الشاعر التجريبي", category: "شراب", pack: "عبوة · 100 مل", price: 28, stock: 74, reserved: 12, expiry: "2027-05", code: "62800001187", tag: "عرض تجريبي" },
  { id: "MED-2051", name: "مستلزمات عناية تجريبية", scientificName: "مستلزم توضيحي", manufacturer: "المصنع الوطني التجريبي", category: "مستلزمات", pack: "عبوة · 50 قطعة", price: 65, stock: 18, reserved: 8, expiry: "2028-02", code: "62800002051" },
  { id: "MED-2290", name: "كريم عناية تجريبي", scientificName: "تركيبة توضيحية", manufacturer: "المصنع الوطني التجريبي", category: "كريمات", pack: "عبوة · 30 غرامًا", price: 34, stock: 9, reserved: 3, expiry: "2027-01", code: "62800002290", tag: "مخزون منخفض" },
  { id: "MED-3104", name: "أقراص دعم تجريبية", scientificName: "تركيبة توضيحية", manufacturer: "مصنع الشاعر التجريبي", category: "أقراص", pack: "علبة · 10 أقراص", price: 19, stock: 132, reserved: 18, expiry: "2028-06", code: "62800003104" },
  { id: "MED-3288", name: "مستلزم طبي تجريبي", scientificName: "مستلزم توضيحي", manufacturer: "مصنع الشاعر التجريبي", category: "مستلزمات", pack: "عبوة · 100 قطعة", price: 52, stock: 46, reserved: 6, expiry: "2027-12", code: "62800003288" },
]

const orderItems = (entries: Array<[string, number]>) => entries.map(([productId, quantity]) => {
  const product = demoProducts.find((item) => item.id === productId)!
  return { productId, name: product.name, quantity, unitPrice: product.price }
})

export const demoOrders: Order[] = [
  { id: "ORD-241", pharmacy: "صيدلية الندى التجريبية", pharmacyPhone: "050 000 0141", region: "حي الندى، الرياض", items: orderItems([["MED-1042", 8], ["MED-1187", 5]]), total: 476, orderStatus: "pending", deliveryStatus: null, paymentStatus: "unpaid", paymentMethod: "آجل", paidAmount: 0, assignedTo: null, createdAt: hoursAgo(1), invoiceId: null, recipientName: "مها العتيبي", deliveryAddress: "حي الندى، شارع الأمير ناصر", requestedDeliveryWindow: "صباحًا", note: "التسليم قبل الساعة ٢ مساءً" },
  { id: "ORD-240", pharmacy: "صيدلية الشفاء التجريبية", pharmacyPhone: "050 000 0183", region: "حي الملقا، الرياض", items: orderItems([["MED-2051", 4], ["MED-2290", 6]]), total: 464, orderStatus: "accepted", deliveryStatus: null, paymentStatus: "unpaid", paymentMethod: "تحويل بنكي", paidAmount: 0, assignedTo: null, createdAt: hoursAgo(2), invoiceId: null, recipientName: "نورة الحربي", deliveryAddress: "حي الملقا، طريق أنس بن مالك", requestedDeliveryWindow: "بعد الظهر" },
  { id: "ORD-239", pharmacy: "صيدلية الياسمين التجريبية", pharmacyPhone: "050 000 0294", region: "حي الياسمين، الرياض", items: orderItems([["MED-3104", 12], ["MED-3288", 3]]), total: 384, orderStatus: "ready", deliveryStatus: null, paymentStatus: "unpaid", paymentMethod: "نقدًا عند التسليم", paidAmount: 0, assignedTo: null, createdAt: hoursAgo(3), invoiceId: null, recipientName: "سارة المطيري", deliveryAddress: "حي الياسمين، شارع أبي بكر" },
  { id: "ORD-238", pharmacy: "صيدلية الندى التجريبية", pharmacyPhone: "050 000 0141", region: "حي الندى، الرياض", items: orderItems([["MED-1042", 10], ["MED-2290", 4]]), total: 556, orderStatus: "out_for_delivery", deliveryStatus: "on_way", paymentStatus: "unpaid", paymentMethod: "نقدًا عند التسليم", paidAmount: 0, assignedTo: "DA-101", createdAt: hoursAgo(4), invoiceId: "INV-238", recipientName: "مها العتيبي", deliveryAddress: "حي الندى، شارع الأمير ناصر" },
  { id: "ORD-237", pharmacy: "صيدلية الشفاء التجريبية", pharmacyPhone: "050 000 0183", region: "حي الملقا، الرياض", items: orderItems([["MED-1187", 8], ["MED-3104", 7]]), total: 357, orderStatus: "delivered", deliveryStatus: "delivered", paymentStatus: "partially_paid", paymentMethod: "نقدًا عند التسليم", paidAmount: 100, assignedTo: "DA-102", createdAt: hoursAgo(7), invoiceId: "INV-237", recipientName: "نورة الحربي", deliveryAddress: "حي الملقا، طريق أنس بن مالك", deliveryProof: { recipient: "نورة الحربي", collectedAmount: 100, paymentMethod: "نقدًا", note: "تم التسليم في الاستقبال", deliveredAt: hoursAgo(5) } },
  { id: "ORD-236", pharmacy: "صيدلية الندى التجريبية", pharmacyPhone: "050 000 0141", region: "حي الندى، الرياض", items: orderItems([["MED-2051", 3], ["MED-3288", 2]]), total: 299, orderStatus: "ready", deliveryStatus: "failed", paymentStatus: "unpaid", paymentMethod: "نقدًا عند التسليم", paidAmount: 0, assignedTo: "DA-101", createdAt: hoursAgo(9), invoiceId: "INV-236", rejectionReason: "الصيدلية مغلقة · إعادة المحاولة مطلوبة" },
]

export const demoPharmacies: Pharmacy[] = [
  { id: "PH-1001", name: "صيدلية الندى التجريبية", contact: "050 000 0141", region: "حي الندى، الرياض", license: "ترخيص تجريبي · 1001", status: "approved", balance: 556, lastOrder: "اليوم، ٩:٢٤ ص" },
  { id: "PH-1002", name: "صيدلية الشفاء التجريبية", contact: "050 000 0183", region: "حي الملقا، الرياض", license: "ترخيص تجريبي · 1002", status: "approved", balance: 721, lastOrder: "اليوم، ٨:٥٠ ص" },
  { id: "PH-1003", name: "صيدلية الياسمين التجريبية", contact: "050 000 0294", region: "حي الياسمين، الرياض", license: "ترخيص تجريبي · 1003", status: "pending", balance: 0, lastOrder: "لا يوجد" },
  { id: "PH-1004", name: "صيدلية الروضة التجريبية", contact: "050 000 0312", region: "حي الروضة، الرياض", license: "ترخيص تجريبي · 1004", status: "suspended", balance: 820, lastOrder: "أمس، ٤:١٢ م" },
]

export const demoInvoices: Invoice[] = [
  { id: "INV-238", orderId: "ORD-238", pharmacy: "صيدلية الندى التجريبية", issuedAt: hoursAgo(4), total: 556, paidAmount: 0, paymentMethod: "نقدًا عند التسليم" },
  { id: "INV-237", orderId: "ORD-237", pharmacy: "صيدلية الشفاء التجريبية", issuedAt: hoursAgo(7), total: 357, paidAmount: 100, paymentMethod: "نقدًا عند التسليم" },
  { id: "INV-236", orderId: "ORD-236", pharmacy: "صيدلية الندى التجريبية", issuedAt: hoursAgo(9), total: 299, paidAmount: 0, paymentMethod: "نقدًا عند التسليم" },
]

export const demoDeliveryAgents: DeliveryAgent[] = [
  { id: "DA-101", name: "عمر السبيعي", phone: "050 000 0221", region: "شمال الرياض", status: "busy" },
  { id: "DA-102", name: "سارة الحربي", phone: "050 000 0222", region: "وسط الرياض", status: "available" },
  { id: "DA-103", name: "فيصل المطيري", phone: "050 000 0223", region: "شرق الرياض", status: "available" },
]

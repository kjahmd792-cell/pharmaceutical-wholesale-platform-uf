export type Role = "company" | "pharmacy" | "driver"

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "rejected"
  | "cancelled"

export type DeliveryStatus = "assigned" | "on_way" | "arrived" | "delivered" | "failed"
export type PaymentStatus = "unpaid" | "partially_paid" | "paid"

export type Product = {
  id: string
  name: string
  scientificName: string
  manufacturer: string
  category: string
  pack: string
  price: number
  stock: number
  reserved: number
  expiry: string
  code: string
  tag?: string
}

export type OrderItem = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export type DeliveryProof = {
  recipient: string
  collectedAmount: number
  paymentMethod: string
  note: string
  deliveredAt: string
  otpVerified?: boolean
}

export type Order = {
  id: string
  pharmacy: string
  pharmacyPhone: string
  region: string
  items: OrderItem[]
  total: number
  orderStatus: OrderStatus
  deliveryStatus: DeliveryStatus | null
  paymentStatus: PaymentStatus
  paymentMethod: string
  paidAmount: number
  assignedTo: string | null
  createdAt: string
  invoiceId: string | null
  note?: string
  recipientName?: string
  deliveryAddress?: string
  requestedDeliveryWindow?: string
  rejectionReason?: string
  deliveryProof?: DeliveryProof
}

export type Pharmacy = {
  id: string
  name: string
  contact: string
  region: string
  license: string
  status: "approved" | "pending" | "suspended"
  balance: number
  lastOrder: string
}

export type Invoice = {
  id: string
  orderId: string
  pharmacy: string
  issuedAt: string
  total: number
  paidAmount: number
  paymentMethod: string
}

export type CheckoutDetails = {
  recipientName: string
  phone: string
  address: string
  deliveryWindow: string
  paymentMethod: string
  note: string
}

export type CartLine = {
  productId: string
  quantity: number
}

export type DeliveryAgent = {
  id: string
  name: string
  phone: string
  region: string
  status: "available" | "busy" | "offline"
}

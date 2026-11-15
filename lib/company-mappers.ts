import type { DeliveryProof, Order, Product } from "@/components/wholesale/types"
import { companyOrders, companyProducts } from "@/lib/db/schema"

export function mapCompanyProduct(row: typeof companyProducts.$inferSelect): Product {
  return {
    id: row.id,
    name: row.name,
    scientificName: row.scientificName,
    manufacturer: row.manufacturer,
    category: row.category,
    pack: row.pack,
    price: row.priceCents / 100,
    stock: row.stock,
    reserved: row.reserved,
    expiry: row.expiry,
    code: row.code,
    tag: row.tag ?? undefined,
  }
}

export function mapCompanyOrder(row: typeof companyOrders.$inferSelect): Order {
  return {
    id: row.id,
    pharmacy: row.pharmacy,
    pharmacyPhone: row.pharmacyPhone,
    region: row.region,
    items: row.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
    })),
    total: row.totalCents / 100,
    orderStatus: row.orderStatus,
    deliveryStatus: row.deliveryStatus,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    paidAmount: row.paidCents / 100,
    assignedTo: row.assignedTo,
    createdAt: row.createdAt.toISOString(),
    invoiceId: row.invoiceId,
    note: row.note ?? undefined,
    recipientName: row.recipientName,
    deliveryAddress: row.deliveryAddress,
    requestedDeliveryWindow: row.requestedDeliveryWindow,
    rejectionReason: row.rejectionReason ?? undefined,
    deliveryProof: row.deliveryProof as DeliveryProof | null ?? undefined,
  }
}

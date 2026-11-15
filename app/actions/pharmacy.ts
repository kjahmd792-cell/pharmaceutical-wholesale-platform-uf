"use server"

import { randomUUID } from "node:crypto"
import { and, eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { demoProducts } from "@/components/wholesale/demo-data"
import type { CartLine, CheckoutDetails, Order } from "@/components/wholesale/types"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pharmacyOrders, pharmacyProfiles, pharmacyProducts } from "@/lib/db/schema"
import { mapOrder } from "@/lib/pharmacy-mappers"

export type PharmacyRegistrationInput = {
  pharmacyName: string
  contactName: string
  phone: string
  region: string
  licenseNumber: string
}

export type PharmacyMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type Availability = { id: string; stock: number; reserved: number }
type OrderMutationData = { order: Order; availability: Availability[] }
type StoredLine = { productId: string; name: string; quantity: number; unitPriceCents: number }

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return session.user.id
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function validPhone(value: string) {
  return /^[+0-9٠-٩\s()-]{7,24}$/.test(value)
}

export async function completePharmacyRegistration(
  input: PharmacyRegistrationInput,
): Promise<PharmacyMutationResult<null>> {
  const userId = await getUserId()
  if (!userId) return { ok: false, error: "سجّل الدخول أولًا لإكمال ملف الصيدلية." }

  const profile = {
    pharmacyName: cleanText(input?.pharmacyName, 100),
    contactName: cleanText(input?.contactName, 80),
    phone: cleanText(input?.phone, 24),
    region: cleanText(input?.region, 60),
    licenseNumber: cleanText(input?.licenseNumber, 48),
  }

  if (
    profile.pharmacyName.length < 2 ||
    profile.contactName.length < 2 ||
    !validPhone(profile.phone) ||
    profile.region.length < 2 ||
    profile.licenseNumber.length < 4
  ) {
    return { ok: false, error: "تحقق من بيانات الصيدلية ورقم التواصل والترخيص." }
  }

  try {
    await db.insert(pharmacyProfiles).values({ userId, ...profile, updatedAt: new Date() }).onConflictDoUpdate({
      target: pharmacyProfiles.userId,
      set: { ...profile, updatedAt: new Date() },
    })

    const [existingProduct] = await db
      .select({ id: pharmacyProducts.id })
      .from(pharmacyProducts)
      .where(eq(pharmacyProducts.userId, userId))
      .limit(1)

    if (!existingProduct) {
      await db.insert(pharmacyProducts).values(
        demoProducts.map((product) => ({
          userId,
          id: product.id,
          name: product.name,
          scientificName: product.scientificName,
          manufacturer: product.manufacturer,
          category: product.category,
          pack: product.pack,
          priceCents: Math.round(product.price * 100),
          stock: product.stock,
          reserved: 0,
          expiry: product.expiry,
          code: product.code,
          tag: product.tag ?? null,
          updatedAt: new Date(),
        })),
      ).onConflictDoNothing()
    }

    revalidatePath("/pharmacy/portal")
    return { ok: true, data: null }
  } catch (error) {
    console.error("[v0] pharmacy registration persistence failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return { ok: false, error: "تعذر حفظ الملف الآن. حاول مرة أخرى." }
  }
}

function parseCheckoutDetails(value: unknown): CheckoutDetails | null {
  if (!value || typeof value !== "object") return null
  const details = value as Record<string, unknown>
  const recipientName = cleanText(details.recipientName, 80)
  const phone = cleanText(details.phone, 24)
  const address = cleanText(details.address, 240)
  const deliveryWindow = cleanText(details.deliveryWindow, 32)
  const paymentMethod = cleanText(details.paymentMethod, 32)
  const note = cleanText(details.note, 300)

  if (
    recipientName.length < 2 ||
    !validPhone(phone) ||
    address.length < 8 ||
    !["أي وقت", "صباحًا", "بعد الظهر"].includes(deliveryWindow) ||
    !["آجل", "تحويل بنكي", "نقدًا عند التسليم"].includes(paymentMethod)
  ) {
    return null
  }

  return { recipientName, phone, address, deliveryWindow, paymentMethod, note }
}

function parseCart(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null
  const quantities = new Map<string, number>()
  let totalUnits = 0

  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return null
    const line = candidate as Record<string, unknown>
    const productId = cleanText(line.productId, 64)
    const quantity = line.quantity
    if (!/^[A-Za-z0-9-]{1,64}$/.test(productId) || !Number.isSafeInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 1000) {
      return null
    }
    const nextQuantity = (quantities.get(productId) ?? 0) + (quantity as number)
    if (nextQuantity > 1000) return null
    quantities.set(productId, nextQuantity)
    totalUnits += quantity as number
    if (totalUnits > 5000) return null
  }

  return quantities
}

export async function createPharmacyOrder(
  rawCart: CartLine[],
  rawDetails: CheckoutDetails,
): Promise<PharmacyMutationResult<OrderMutationData>> {
  const userId = await getUserId()
  if (!userId) return { ok: false, error: "انتهت الجلسة. سجّل الدخول مجددًا." }

  const cart = parseCart(rawCart)
  const details = parseCheckoutDetails(rawDetails)
  if (!cart || !details) return { ok: false, error: "تحقق من تفاصيل التسليم والكميات المختارة." }

  try {
    const [profile] = await db.select().from(pharmacyProfiles).where(eq(pharmacyProfiles.userId, userId)).limit(1)
    if (!profile) return { ok: false, error: "أكمل ملف الصيدلية قبل إرسال الطلب." }

    const result = await db.transaction(async (tx) => {
      const productRows: Array<{ product: typeof pharmacyProducts.$inferSelect; quantity: number }> = []
      for (const [productId, quantity] of cart) {
        const [product] = await tx.select().from(pharmacyProducts).where(and(
          eq(pharmacyProducts.userId, userId),
          eq(pharmacyProducts.id, productId),
        )).limit(1)
        if (!product || product.stock - product.reserved < quantity) throw new Error("STOCK_CHANGED")
        productRows.push({ product, quantity })
      }

      const items: StoredLine[] = productRows.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        quantity,
        unitPriceCents: product.priceCents,
      }))
      const totalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
      if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > 100_000_000) throw new Error("INVALID_TOTAL")

      const availability: Availability[] = []
      for (const { product, quantity } of productRows) {
        const [updatedProduct] = await tx.update(pharmacyProducts).set({
          reserved: sql`${pharmacyProducts.reserved} + ${quantity}`,
          updatedAt: new Date(),
        }).where(and(
          eq(pharmacyProducts.userId, userId),
          eq(pharmacyProducts.id, product.id),
          sql`${pharmacyProducts.stock} - ${pharmacyProducts.reserved} >= ${quantity}`,
        )).returning({ id: pharmacyProducts.id, stock: pharmacyProducts.stock, reserved: pharmacyProducts.reserved })
        if (!updatedProduct) throw new Error("STOCK_CHANGED")
        availability.push(updatedProduct)
      }

      const [savedOrder] = await tx.insert(pharmacyOrders).values({
        id: `ORD-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId,
        pharmacy: profile.pharmacyName,
        pharmacyPhone: details.phone,
        region: profile.region,
        items,
        totalCents,
        orderStatus: "pending",
        deliveryStatus: null,
        paymentStatus: "unpaid",
        paymentMethod: details.paymentMethod,
        paidCents: 0,
        assignedTo: null,
        note: details.note || null,
        recipientName: details.recipientName,
        deliveryAddress: details.address,
        requestedDeliveryWindow: details.deliveryWindow,
      }).returning()
      if (!savedOrder) throw new Error("ORDER_NOT_SAVED")
      return { order: mapOrder(savedOrder), availability }
    })

    revalidatePath("/pharmacy/portal")
    return { ok: true, data: result }
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_CHANGED") {
      return { ok: false, error: "تغيرت الكمية المتاحة. حدّث السلة وحاول مرة أخرى." }
    }
    console.error("[v0] pharmacy order persistence failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return { ok: false, error: "تعذر حفظ الطلب الآن. حاول مرة أخرى." }
  }
}

export async function cancelPharmacyOrder(orderId: string): Promise<PharmacyMutationResult<OrderMutationData>> {
  const userId = await getUserId()
  if (!userId) return { ok: false, error: "انتهت الجلسة. سجّل الدخول مجددًا." }
  const safeOrderId = cleanText(orderId, 64)
  if (!safeOrderId) return { ok: false, error: "الطلب غير متاح." }

  try {
    const result = await db.transaction(async (tx) => {
      const [cancelledOrder] = await tx.update(pharmacyOrders).set({
        orderStatus: "cancelled",
      }).where(and(
        eq(pharmacyOrders.id, safeOrderId),
        eq(pharmacyOrders.userId, userId),
        eq(pharmacyOrders.orderStatus, "pending"),
      )).returning()
      if (!cancelledOrder) throw new Error("ORDER_NOT_CANCELLABLE")

      const availability: Availability[] = []
      for (const item of cancelledOrder.items) {
        const [updatedProduct] = await tx.update(pharmacyProducts).set({
          reserved: sql`${pharmacyProducts.reserved} - ${item.quantity}`,
          updatedAt: new Date(),
        }).where(and(
          eq(pharmacyProducts.userId, userId),
          eq(pharmacyProducts.id, item.productId),
          sql`${pharmacyProducts.reserved} >= ${item.quantity}`,
        )).returning({ id: pharmacyProducts.id, stock: pharmacyProducts.stock, reserved: pharmacyProducts.reserved })
        if (!updatedProduct) throw new Error("RESERVATION_NOT_FOUND")
        availability.push(updatedProduct)
      }
      return { order: mapOrder(cancelledOrder), availability }
    })

    revalidatePath("/pharmacy/portal")
    return { ok: true, data: result }
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_CANCELLABLE") {
      return { ok: false, error: "يمكن إلغاء الطلبات التي ما زالت قيد المراجعة فقط." }
    }
    console.error("[v0] pharmacy order cancellation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return { ok: false, error: "تعذر إلغاء الطلب الآن. حاول مرة أخرى." }
  }
}

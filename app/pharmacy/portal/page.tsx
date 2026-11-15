import { asc, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { PharmacyPortal } from "@/components/wholesale/pharmacy-portal"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pharmacyOrders, pharmacyProfiles, pharmacyProducts } from "@/lib/db/schema"
import { mapOrder, mapProduct } from "@/lib/pharmacy-mappers"

export default async function PharmacyPortalPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const userId = session.user.id
  const [profile] = await db
    .select()
    .from(pharmacyProfiles)
    .where(eq(pharmacyProfiles.userId, userId))
    .limit(1)

  if (!profile) redirect("/complete-registration")

  const [productRows, orderRows] = await Promise.all([
    db.select().from(pharmacyProducts).where(eq(pharmacyProducts.userId, userId)).orderBy(asc(pharmacyProducts.name)),
    db.select().from(pharmacyOrders).where(eq(pharmacyOrders.userId, userId)).orderBy(desc(pharmacyOrders.createdAt)),
  ])
  const orders = orderRows.map(mapOrder)

  return (
    <PharmacyPortal
      email={session.user.email}
      profile={{
        id: `PH-${userId.slice(-8).toUpperCase()}`,
        name: profile.pharmacyName,
        contact: profile.contactName,
        phone: profile.phone,
        region: profile.region,
        license: profile.licenseNumber,
        status: "approved",
        balance: 0,
        lastOrder: orders[0]?.createdAt ?? "—",
      }}
      initialProducts={productRows.map(mapProduct)}
      initialOrders={orders}
    />
  )
}

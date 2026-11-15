import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pharmacyProfiles } from "@/lib/db/schema"

export default async function CompleteRegistrationPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const [profile] = await db
    .select({ userId: pharmacyProfiles.userId })
    .from(pharmacyProfiles)
    .where(eq(pharmacyProfiles.userId, session.user.id))
    .limit(1)

  if (profile) redirect("/pharmacy/portal")
  return <AuthForm mode="complete-registration" />
}

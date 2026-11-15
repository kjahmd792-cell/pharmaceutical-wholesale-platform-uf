import { WholesaleApp } from "@/components/wholesale/wholesale-app"
import type { DemoRole } from "@/components/wholesale/wholesale-app"

type PageProps = {
  searchParams: Promise<{ role?: string }>
}

const demoRoles: DemoRole[] = ["owner", "inventory", "orders", "dispatcher", "driver", "pharmacy"]

export default async function CompanyAppPage({ searchParams }: PageProps) {
  const { role } = await searchParams
  const initialDemoRole = demoRoles.includes(role as DemoRole) ? role as DemoRole : "owner"
  return <WholesaleApp key={initialDemoRole} initialRole="company" initialDemoRole={initialDemoRole} />
}

import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

function exactOrigin(value?: string) {
  if (!value) return undefined
  try {
    return new URL(value).origin
  } catch {
    return undefined
  }
}

const developmentOrigins = [
  exactOrigin(process.env.V0_RUNTIME_URL),
  exactOrigin(process.env.V0_DEV_APP_URL),
  exactOrigin(process.env.V0_BUILD_URL),
  exactOrigin(process.env.V0_SANDBOX_URL),
].filter((origin): origin is string => Boolean(origin))

const productionOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
].filter((origin): origin is string => Boolean(origin))

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  trustedOrigins:
    process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", ...developmentOrigins]
      : productionOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})

import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import type { DeliveryProof, DeliveryStatus, OrderStatus, PaymentStatus } from "@/components/wholesale/types"

export type StoredOrderItem = {
  productId: string
  name: string
  quantity: number
  unitPriceCents: number
}

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

export const pharmacyProfiles = pgTable("pharmacy_profiles", {
  userId: text("userId").primaryKey(),
  pharmacyName: text("pharmacyName").notNull(),
  contactName: text("contactName").notNull(),
  phone: text("phone").notNull(),
  region: text("region").notNull(),
  licenseNumber: text("licenseNumber").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const pharmacyProducts = pgTable("pharmacy_products", {
  userId: text("userId").notNull(),
  id: text("id").notNull(),
  name: text("name").notNull(),
  scientificName: text("scientificName").notNull(),
  manufacturer: text("manufacturer").notNull(),
  category: text("category").notNull(),
  pack: text("pack").notNull(),
  priceCents: integer("priceCents").notNull(),
  stock: integer("stock").notNull(),
  reserved: integer("reserved").notNull().default(0),
  expiry: text("expiry").notNull(),
  code: text("code").notNull(),
  tag: text("tag"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.id] })])

export const pharmacyOrders = pgTable("pharmacy_orders", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  pharmacy: text("pharmacy").notNull(),
  pharmacyPhone: text("pharmacyPhone").notNull(),
  region: text("region").notNull(),
  items: jsonb("items").$type<StoredOrderItem[]>().notNull(),
  totalCents: integer("totalCents").notNull(),
  orderStatus: text("orderStatus").$type<OrderStatus>().notNull().default("pending"),
  deliveryStatus: text("deliveryStatus").$type<DeliveryStatus>(),
  paymentStatus: text("paymentStatus").$type<PaymentStatus>().notNull().default("unpaid"),
  paymentMethod: text("paymentMethod").notNull(),
  paidCents: integer("paidCents").notNull().default(0),
  assignedTo: text("assignedTo"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  invoiceId: text("invoiceId"),
  note: text("note"),
  recipientName: text("recipientName").notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  requestedDeliveryWindow: text("requestedDeliveryWindow").notNull(),
  rejectionReason: text("rejectionReason"),
  deliveryProof: jsonb("deliveryProof").$type<DeliveryProof>(),
}, (table) => [index("pharmacy_orders_user_created_at_idx").on(table.userId, table.createdAt)])

export type CompanyRole = "owner" | "admin" | "inventory" | "orders" | "dispatcher" | "driver" | "pharmacy"
export type CompanyInviteRole = Exclude<CompanyRole, "owner">

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerUserId: text("ownerUserId").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const companyMembers = pgTable("company_members", {
  userId: text("userId").primaryKey(),
  companyId: text("companyId").notNull(),
  role: text("role").$type<CompanyRole>().notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [index("company_members_company_idx").on(table.companyId)])

export const companyInvites = pgTable("company_invites", {
  id: text("id").primaryKey(),
  companyId: text("companyId").notNull(),
  codeHash: text("codeHash").notNull().unique(),
  role: text("role").$type<CompanyInviteRole>().notNull(),
  createdBy: text("createdBy").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  redeemedBy: text("redeemedBy"),
  redeemedAt: timestamp("redeemedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [index("company_invites_company_idx").on(table.companyId, table.createdAt.desc())])

export const companyProducts = pgTable("company_products", {
  id: text("id").primaryKey(),
  companyId: text("companyId").notNull(),
  name: text("name").notNull(),
  scientificName: text("scientificName").notNull(),
  manufacturer: text("manufacturer").notNull(),
  category: text("category").notNull(),
  pack: text("pack").notNull(),
  priceCents: integer("priceCents").notNull(),
  stock: integer("stock").notNull(),
  reserved: integer("reserved").notNull().default(0),
  expiry: text("expiry").notNull(),
  code: text("code").notNull(),
  tag: text("tag"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [
  index("company_products_company_name_idx").on(table.companyId, table.name),
  uniqueIndex("company_products_companyId_code_key").on(table.companyId, table.code),
])

export const companyPharmacies = pgTable("company_pharmacies", {
  companyId: text("companyId").notNull(),
  pharmacyUserId: text("pharmacyUserId").notNull(),
  status: text("status").$type<"pending" | "approved" | "suspended">().notNull().default("pending"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.companyId, table.pharmacyUserId] }),
  index("company_pharmacies_company_status_idx").on(table.companyId, table.status),
])

export const companyOrders = pgTable("company_orders", {
  id: text("id").primaryKey(),
  companyId: text("companyId").notNull(),
  pharmacyUserId: text("pharmacyUserId").notNull(),
  pharmacy: text("pharmacy").notNull(),
  pharmacyPhone: text("pharmacyPhone").notNull(),
  region: text("region").notNull(),
  items: jsonb("items").$type<StoredOrderItem[]>().notNull(),
  totalCents: integer("totalCents").notNull(),
  orderStatus: text("orderStatus").$type<OrderStatus>().notNull().default("pending"),
  deliveryStatus: text("deliveryStatus").$type<DeliveryStatus>(),
  paymentStatus: text("paymentStatus").$type<PaymentStatus>().notNull().default("unpaid"),
  paymentMethod: text("paymentMethod").notNull(),
  paidCents: integer("paidCents").notNull().default(0),
  assignedTo: text("assignedTo"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  invoiceId: text("invoiceId"),
  note: text("note"),
  recipientName: text("recipientName").notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  requestedDeliveryWindow: text("requestedDeliveryWindow").notNull(),
  rejectionReason: text("rejectionReason"),
  deliveryProof: jsonb("deliveryProof").$type<DeliveryProof>(),
}, (table) => [
  index("company_orders_company_created_at_idx").on(table.companyId, table.createdAt.desc()),
  index("company_orders_pharmacy_created_at_idx").on(table.pharmacyUserId, table.createdAt.desc()),
])

export const companyStockMovements = pgTable("company_stock_movements", {
  id: text("id").primaryKey(),
  companyId: text("companyId").notNull(),
  productId: text("productId").notNull(),
  changedBy: text("changedBy").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [index("company_stock_movements_company_created_at_idx").on(table.companyId, table.createdAt.desc())])

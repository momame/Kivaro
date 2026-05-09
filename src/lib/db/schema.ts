import { pgTable, uuid, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  scanCountMonth: integer("scan_count_month").notNull().default(0),
  scanResetDate: timestamp("scan_reset_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  clerkId: text("clerk_id").notNull().unique(),
  role: text("role", { enum: ["owner", "staff"] }).notNull().default("owner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  currentStock: numeric("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minThreshold: numeric("min_threshold", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  photoUrl: text("photo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  phone: text("phone"),
  visitCount: integer("visit_count").notNull().default(0),
  lastVisit: timestamp("last_visit"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  customerId: uuid("customer_id").references(() => customers.id),
  guestName: text("guest_name").notNull(),
  phone: text("phone"),
  partySize: integer("party_size").notNull(),
  datetime: timestamp("datetime").notNull(),
  status: text("status", { enum: ["confirmed", "seated", "no_show", "cancelled"] }).notNull().default("confirmed"),
  notes: text("notes"),
  noShowScore: numeric("no_show_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

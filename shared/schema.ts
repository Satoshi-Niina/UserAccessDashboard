
import { mysqlTable, varchar, int, boolean, decimal, timestamp, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const manufacturers = mysqlTable("manufacturers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const models = mysqlTable("models", {
  id: int("id").primaryKey().autoincrement(),
  manufacturerId: int("manufacturer_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inspectionItems = mysqlTable("inspection_items", {
  id: int("id").primaryKey().autoincrement(),
  modelId: int("model_id").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subCategory: varchar("sub_category", { length: 50 }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  checkMethod: text("check_method"),
  judgmentCriteria: text("judgment_criteria"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const measurementRecords = mysqlTable("measurement_records", {
  id: int("id").primaryKey().autoincrement(),
  inspectionItemId: int("inspection_item_id").notNull(),
  minValue: decimal("min_value", { precision: 10, scale: 2 }),
  maxValue: decimal("max_value", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const visualInspectionRecords = mysqlTable("visual_inspection_records", {
  id: int("id").primaryKey().autoincrement(),
  inspectionItemId: int("inspection_item_id").notNull(),
  imageReference: varchar("image_reference", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inspectionChecklists = mysqlTable("inspection_checklists", {
  id: int("id").primaryKey().autoincrement(),
  vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
  modelId: int("model_id").notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  inspector: varchar("inspector", { length: 100 }).notNull(),
  supervisor: varchar("supervisor", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

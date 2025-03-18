
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
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: varchar("code", { length: 20 }).notNull().unique(),
});

export const models = mysqlTable("models", {
  id: int("id").primaryKey().autoincrement(),
  manufacturerId: int("manufacturer_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
});

export const inspectionItems = mysqlTable("inspection_items", {
  id: int("id").primaryKey().autoincrement(),
  modelId: int("model_id").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subCategory: varchar("sub_category", { length: 50 }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  checkMethod: text("check_method"),
  judgmentCriteria: text("judgment_criteria"),
});

export const measurementRecords = mysqlTable("measurement_records", {
  id: int("id").primaryKey().autoincrement(),
  inspectionItemId: int("inspection_item_id").notNull(),
  minValue: decimal("min_value", { precision: 10, scale: 2 }),
  maxValue: decimal("max_value", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }),
});

export const visualInspectionRecords = mysqlTable("visual_inspection_records", {
  id: int("id").primaryKey().autoincrement(),
  inspectionItemId: int("inspection_item_id").notNull(),
  imageReference: varchar("image_reference", { length: 255 }),
  description: text("description"),
});

export const inspectionChecklists = mysqlTable("inspection_checklists", {
  id: int("id").primaryKey().autoincrement(),
  vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
  modelId: int("model_id").notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  inspector: varchar("inspector", { length: 100 }).notNull(),
  supervisor: varchar("supervisor", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
});

export const inspectionResults = mysqlTable("inspection_results", {
  id: int("id").primaryKey().autoincrement(),
  checklistId: int("checklist_id").notNull(),
  inspectionItemId: int("inspection_item_id").notNull(),
  result: varchar("result", { length: 50 }).notNull(),
  measurementValue: decimal("measurement_value", { precision: 10, scale: 2 }),
  remarks: text("remarks"),
  inspectedAt: timestamp("inspected_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

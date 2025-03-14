
import { mysqlTable, varchar, int, boolean, decimal } from "drizzle-orm/mysql-core";
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
});

export const models = mysqlTable("models", {
  id: int("id").primaryKey().autoincrement(),
  manufacturerId: int("manufacturer_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const equipment = mysqlTable("equipment", {
  id: int("id").primaryKey().autoincrement(),
  categoryId: int("category_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const measurementStandards = mysqlTable("measurement_standards", {
  id: int("id").primaryKey().autoincrement(),
  modelId: int("model_id").notNull(),
  equipmentId: int("equipment_id").notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  minValue: decimal("min_value", { precision: 10, scale: 2 }),
  maxValue: decimal("max_value", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }),
});

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

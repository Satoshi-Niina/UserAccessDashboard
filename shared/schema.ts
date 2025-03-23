import { mysqlTable, varchar, int } from "drizzle-orm/mysql-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 製造メーカーテーブル
export const manufacturers = mysqlTable("manufacturers", {
  manufacturerId: int("manufacturer_id").primaryKey().autoincrement(),
  manufacturerName: varchar("manufacturer_name", { length: 100 }).notNull(),
});

export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  models: many(models),
  machines: many(machines)
}));

// 機種テーブル
export const models = mysqlTable("models", {
  modelId: int("model_id").primaryKey(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  manufacturerId: int("manufacturer_id").notNull().references(() => manufacturers.manufacturerId),
});

export const modelsRelations = relations(models, ({ one, many }) => ({
  manufacturer: one(manufacturers, {
    fields: [models.manufacturerId],
    references: [manufacturers.manufacturerId],
  }),
  machines: many(machines)
}));

// 機械番号テーブル
export const machines = mysqlTable("machines", {
  id: int("id").primaryKey().autoincrement(),
  machineNumber: varchar("machine_number", { length: 20 }).notNull().unique(),
  modelId: int("model_id").notNull().references(() => models.modelId),
  manufacturerId: int("manufacturer_id").notNull().references(() => manufacturers.manufacturerId),
});

export const machinesRelations = relations(machines, ({ one, many }) => ({
  manufacturer: one(manufacturers, {
    fields: [machines.manufacturerId],
    references: [manufacturers.manufacturerId],
  }),
  model: one(models, {
    fields: [machines.modelId],
    references: [models.modelId],
  }),
  inspections: many(inspections)
}));

// 点検項目テーブル
export const inspections = mysqlTable("inspections", {
  inspectionId: int("inspection_id").primaryKey().autoincrement(),
  machineId: varchar("machine_id", { length: 20 }).notNull().references(() => machines.machineId),
  inspectionDetail: varchar("inspection_detail", { length: 255 }).notNull(),
});

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  machine: one(machines, {
    fields: [inspections.machineId],
    references: [machines.machineId],
  })
}));


export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const inspectionItems = mysqlTable("inspection_items", {
  id: int("id").primaryKey().autoincrement(),
  modelId: int("model_id").notNull().references(() => models.modelId),
  category: varchar("category", { length: 50 }).notNull(),
  subCategory: varchar("sub_category", { length: 50 }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  checkMethod: text("check_method"),
  judgmentCriteria: text("judgment_criteria"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inspectionItemsRelations = relations(inspectionItems, ({ one, many }) => ({
  model: one(models, {
    fields: [inspectionItems.modelId],
    references: [models.modelId],
  }),
  measurementRecords: many(measurementRecords),
  visualInspectionRecords: many(visualInspectionRecords)
}));

export const measurementRecords = mysqlTable("measurement_records", {
  id: int("id").primaryKey().autoincrement(),
  inspectionItemId: int("inspection_item_id").notNull().references(() => inspectionItems.id),
  minValue: decimal("min_value", { precision: 10, scale: 2 }),
  maxValue: decimal("max_value", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const measurementRecordsRelations = relations(measurementRecords, ({ one }) => ({
  inspectionItem: one(inspectionItems, {
    fields: [measurementRecords.inspectionItemId],
    references: [inspectionItems.id],
  })
}));

export const visualInspectionRecords = mysqlTable("visual_inspection_records", {
  id: int("id").primaryKey().autoincrement(),
  inspectionItemId: int("inspection_item_id").notNull().references(() => inspectionItems.id),
  imageReference: varchar("image_reference", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const visualInspectionRecordsRelations = relations(visualInspectionRecords, ({ one }) => ({
  inspectionItem: one(inspectionItems, {
    fields: [visualInspectionRecords.inspectionItemId],
    references: [inspectionItems.id],
  })
}));

export const inspectionChecklists = mysqlTable("inspection_checklists", {
  id: int("id").primaryKey().autoincrement(),
  machineId: varchar("machine_id", { length: 20 }).notNull().references(() => machines.machineId), 
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
import { boolean, decimal, text, timestamp } from "drizzle-orm/mysql-core";
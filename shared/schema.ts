import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tasks — max 3 per day
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  priority: integer("priority").notNull().default(1), // 1=main, 2=second, 3=third
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull().default("pending"), // pending | done | moved
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Ideas
export const ideas = sqliteTable("ideas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text | voice | photo | tattoo | project
  createdAt: text("created_at").notNull(),
});

export const insertIdeaSchema = createInsertSchema(ideas).omit({ id: true });
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideas.$inferSelect;

// Creative works
export const works = sqliteTable("works", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  meaning: text("meaning").notNull().default(""),
  category: text("category").notNull().default("tattoo"), // tattoo | sketch | photo | symbol | project
  status: text("status").notNull().default("idea"), // idea | in_progress | done
  createdAt: text("created_at").notNull(),
});

export const insertWorkSchema = createInsertSchema(works).omit({ id: true });
export type InsertWork = z.infer<typeof insertWorkSchema>;
export type Work = typeof works.$inferSelect;

// Focus sessions (Mode)
export const focusSessions = sqliteTable("focus_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id"),
  duration: integer("duration").notNull(), // minutes: 25 | 45 | 90
  completedAt: text("completed_at").notNull(),
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({ id: true });
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type FocusSession = typeof focusSessions.$inferSelect;

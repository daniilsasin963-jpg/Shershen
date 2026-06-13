import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";
import { tasks, ideas, works, focusSessions } from "@shared/schema";
import type { InsertTask, Task, InsertIdea, Idea, InsertWork, Work, InsertFocusSession, FocusSession } from "@shared/schema";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite);

// Auto-migrate
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  );
  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    meaning TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'tattoo',
    status TEXT NOT NULL DEFAULT 'idea',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    duration INTEGER NOT NULL,
    completed_at TEXT NOT NULL
  );
`);

export interface IStorage {
  // Tasks
  getTasksByDate(date: string): Task[];
  createTask(data: InsertTask): Task;
  updateTaskStatus(id: number, status: string): Task | undefined;
  getAllTasks(): Task[];

  // Ideas
  getIdeas(): Idea[];
  createIdea(data: InsertIdea): Idea;
  deleteIdea(id: number): void;

  // Works
  getWorks(): Work[];
  createWork(data: InsertWork): Work;
  updateWork(id: number, data: Partial<InsertWork>): Work | undefined;
  deleteWork(id: number): void;

  // Focus sessions
  createFocusSession(data: InsertFocusSession): FocusSession;
  getFocusSessions(): FocusSession[];

  // Stats
  getStats(): {
    totalDone: number;
    currentStreak: number;
    totalIdeas: number;
    totalWorks: number;
    todayDone: number;
  };
}

export class Storage implements IStorage {
  getTasksByDate(date: string): Task[] {
    return db.select().from(tasks).where(eq(tasks.date, date)).all();
  }

  createTask(data: InsertTask): Task {
    return db.insert(tasks).values(data).returning().get();
  }

  updateTaskStatus(id: number, status: string): Task | undefined {
    return db.update(tasks).set({ status }).where(eq(tasks.id, id)).returning().get();
  }

  getAllTasks(): Task[] {
    return db.select().from(tasks).all();
  }

  getIdeas(): Idea[] {
    return db.select().from(ideas).orderBy(desc(ideas.id)).all();
  }

  createIdea(data: InsertIdea): Idea {
    return db.insert(ideas).values(data).returning().get();
  }

  deleteIdea(id: number): void {
    db.delete(ideas).where(eq(ideas.id, id)).run();
  }

  getWorks(): Work[] {
    return db.select().from(works).orderBy(desc(works.id)).all();
  }

  createWork(data: InsertWork): Work {
    return db.insert(works).values(data).returning().get();
  }

  updateWork(id: number, data: Partial<InsertWork>): Work | undefined {
    return db.update(works).set(data).where(eq(works.id, id)).returning().get();
  }

  deleteWork(id: number): void {
    db.delete(works).where(eq(works.id, id)).run();
  }

  createFocusSession(data: InsertFocusSession): FocusSession {
    return db.insert(focusSessions).values(data).returning().get();
  }

  getFocusSessions(): FocusSession[] {
    return db.select().from(focusSessions).all();
  }

  getStats() {
    const allTasks = db.select().from(tasks).all();
    const allIdeas = db.select().from(ideas).all();
    const allWorks = db.select().from(works).all();

    const today = new Date().toISOString().split("T")[0];
    const todayDone = allTasks.filter(t => t.date === today && t.status === "done").length;
    const totalDone = allTasks.filter(t => t.status === "done").length;

    // Calculate streak: consecutive days with at least 1 done task
    const doneDates = [...new Set(allTasks.filter(t => t.status === "done").map(t => t.date))].sort();
    let streak = 0;
    if (doneDates.length > 0) {
      const check = new Date(today);
      for (let i = 0; i < 365; i++) {
        const d = check.toISOString().split("T")[0];
        if (doneDates.includes(d)) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      totalDone,
      currentStreak: streak,
      totalIdeas: allIdeas.length,
      totalWorks: allWorks.length,
      todayDone,
    };
  }
}

export const storage = new Storage();

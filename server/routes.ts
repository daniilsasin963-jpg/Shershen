import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertIdeaSchema, insertWorkSchema, insertFocusSessionSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: ReturnType<typeof createServer>, app: Express) {
  // Tasks
  app.get("/api/tasks", (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
    res.json(storage.getTasksByDate(date));
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      // Check max 3 tasks per day
      const existing = storage.getTasksByDate(data.date);
      if (existing.length >= 3) {
        return res.status(400).json({ error: "Максимум 3 задачи в день" });
      }
      const task = storage.createTask(data);
      res.json(task);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.patch("/api/tasks/:id/status", (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const task = storage.updateTaskStatus(id, status);
    if (!task) return res.status(404).json({ error: "Задача не найдена" });
    res.json(task);
  });

  // Ideas
  app.get("/api/ideas", (req, res) => {
    res.json(storage.getIdeas());
  });

  app.post("/api/ideas", (req, res) => {
    try {
      const data = insertIdeaSchema.parse(req.body);
      const idea = storage.createIdea(data);
      res.json(idea);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.delete("/api/ideas/:id", (req, res) => {
    storage.deleteIdea(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Works
  app.get("/api/works", (req, res) => {
    res.json(storage.getWorks());
  });

  app.post("/api/works", (req, res) => {
    try {
      const data = insertWorkSchema.parse(req.body);
      const work = storage.createWork(data);
      res.json(work);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.patch("/api/works/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const work = storage.updateWork(id, data);
      if (!work) return res.status(404).json({ error: "Работа не найдена" });
      res.json(work);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.delete("/api/works/:id", (req, res) => {
    storage.deleteWork(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Focus sessions
  app.post("/api/focus-sessions", (req, res) => {
    try {
      const data = insertFocusSessionSchema.parse(req.body);
      const session = storage.createFocusSession(data);
      res.json(session);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    res.json(storage.getStats());
  });
}

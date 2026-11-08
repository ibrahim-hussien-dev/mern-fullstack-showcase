import { z } from "zod";
import { Task, STATUSES, PRIORITIES } from "../models/Task.js";
import { AppError } from "../middleware/errorHandler.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const dueDate = z.union([z.null(), z.coerce.date()]);

export const createSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or fewer"),
    description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").optional(),
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    dueDate: dueDate.optional(),
  })
  .strict();

export const patchSchema = createSchema
  .partial()
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: "Provide at least one field to update" });

export const listSchema = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20).transform((n) => Math.min(n, 100)),
});

export async function listTasks(req, res) {
  const { status, q, page, limit } = req.validatedQuery;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }
  const [items, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Task.countDocuments(filter),
  ]);
  res.json({ items, total, page });
}

export async function createTask(req, res) {
  const task = await Task.create(req.body);
  res.status(201).json(task);
}

export async function getTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  res.json(task);
}

export async function updateTask(req, res) {
  const task = await Task.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  res.json(task);
}

export async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  res.status(204).end();
}

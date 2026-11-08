import mongoose from "mongoose";

export const STATUSES = ["todo", "in_progress", "done"];
export const PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: STATUSES, default: "todo", index: true },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

taskSchema.index({ title: "text", description: "text" });
taskSchema.index({ createdAt: -1 });

export const Task = mongoose.model("Task", taskSchema);

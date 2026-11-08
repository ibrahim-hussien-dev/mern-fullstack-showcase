import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { Task } from "../src/models/Task.js";

const day = 86400000;
const samples = [
  { title: "Draft project proposal", description: "Outline scope, timeline and budget.", status: "in_progress", priority: "high", dueDate: new Date(Date.now() + 2 * day) },
  { title: "Review pull requests", status: "todo", priority: "medium" },
  { title: "Update README with run steps", status: "todo", priority: "low" },
  { title: "Fix mobile nav bug", description: "Menu doesn't close after selecting a link.", status: "done", priority: "high" },
  { title: "Book dentist appointment", status: "todo", priority: "low", dueDate: new Date(Date.now() + 7 * day) },
];

await mongoose.connect(env.MONGO_URI);
await Task.deleteMany({});
await Task.insertMany(samples);
console.log(`Seeded ${samples.length} tasks`);
await mongoose.disconnect();

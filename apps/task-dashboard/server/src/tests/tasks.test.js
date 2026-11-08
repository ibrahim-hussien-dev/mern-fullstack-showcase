import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import { Task } from "../models/Task.js";

let mongod;
const missingId = "64b7f0a2c3d4e5f6a7b8c9d0";

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(async () => {
  await Task.deleteMany({});
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("POST /api/tasks", () => {
  it("creates a task with defaults", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "  Write tests " });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Write tests", status: "todo", priority: "medium", description: "" });
    expect(res.body._id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });
  it("rejects a missing title", async () => {
    const res = await request(app).post("/api/tasks").send({ description: "x" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
  it("rejects title over 120 chars", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "a".repeat(121) });
    expect(res.status).toBe(400);
  });
  it("rejects invalid status and unknown fields", async () => {
    expect((await request(app).post("/api/tasks").send({ title: "a", status: "nope" })).status).toBe(400);
    expect((await request(app).post("/api/tasks").send({ title: "a", admin: true })).status).toBe(400);
  });
  it("rejects malformed JSON", async () => {
    const res = await request(app).post("/api/tasks").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

describe("GET /api/tasks", () => {
  beforeEach(async () => {
    for (const t of [
      { title: "Buy milk", status: "todo" },
      { title: "Write report", description: "quarterly numbers", status: "in_progress" },
      { title: "Ship release", status: "done" },
    ]) {
      await Task.create(t);
    }
  });
  it("lists newest first with total and page", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
    expect(res.body.items[0].title).toBe("Ship release");
  });
  it("filters by status", async () => {
    const res = await request(app).get("/api/tasks?status=done");
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toBe("Ship release");
  });
  it("searches title and description", async () => {
    const res = await request(app).get("/api/tasks?q=quarter");
    expect(res.body.items.map((t) => t.title)).toEqual(["Write report"]);
  });
  it("paginates and caps limit at 100", async () => {
    const res = await request(app).get("/api/tasks?limit=2&page=2");
    expect(res.body.items).toHaveLength(1);
    expect((await request(app).get("/api/tasks?limit=500")).status).toBe(200);
  });
  it("rejects invalid status filter", async () => {
    expect((await request(app).get("/api/tasks?status=bogus")).status).toBe(400);
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns a task", async () => {
    const t = await Task.create({ title: "One" });
    const res = await request(app).get(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("One");
  });
  it("400 for invalid id, 404 for missing", async () => {
    expect((await request(app).get("/api/tasks/not-an-id")).status).toBe(400);
    const res = await request(app).get(`/api/tasks/${missingId}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TASK_NOT_FOUND");
  });
});

describe("PATCH /api/tasks/:id", () => {
  it("updates partial fields", async () => {
    const t = await Task.create({ title: "One" });
    const res = await request(app).patch(`/api/tasks/${t._id}`).send({ status: "done", priority: "high" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "One", status: "done", priority: "high" });
  });
  it("can clear dueDate with null", async () => {
    const t = await Task.create({ title: "One", dueDate: new Date() });
    const res = await request(app).patch(`/api/tasks/${t._id}`).send({ dueDate: null });
    expect(res.status).toBe(200);
    expect(res.body.dueDate == null).toBe(true);
  });
  it("rejects empty body, invalid values, invalid id; 404 for missing", async () => {
    const t = await Task.create({ title: "One" });
    expect((await request(app).patch(`/api/tasks/${t._id}`).send({})).status).toBe(400);
    expect((await request(app).patch(`/api/tasks/${t._id}`).send({ title: "" })).status).toBe(400);
    expect((await request(app).patch("/api/tasks/xyz").send({ title: "a" })).status).toBe(400);
    expect((await request(app).patch(`/api/tasks/${missingId}`).send({ title: "a" })).status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes and returns 204", async () => {
    const t = await Task.create({ title: "One" });
    const res = await request(app).delete(`/api/tasks/${t._id}`);
    expect(res.status).toBe(204);
    expect(await Task.countDocuments()).toBe(0);
  });
  it("400 for invalid id, 404 for missing", async () => {
    expect((await request(app).delete("/api/tasks/xyz")).status).toBe(400);
    expect((await request(app).delete(`/api/tasks/${missingId}`)).status).toBe(404);
  });
});

describe("unknown routes", () => {
  it("returns 404 in the error shape", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

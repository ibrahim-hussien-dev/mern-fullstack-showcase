import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns { ok: true }", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns the standard error shape on unknown routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: "NOT_FOUND" });
  });
});

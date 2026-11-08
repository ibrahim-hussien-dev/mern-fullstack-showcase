import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/tasksApi.js", () => ({
  tasksApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), get: vi.fn() },
}));
import { tasksApi } from "../api/tasksApi.js";
import { useTasks } from "../hooks/useTasks.js";

const task = { _id: "1", title: "A", status: "todo", priority: "medium" };

beforeEach(() => {
  vi.resetAllMocks();
  tasksApi.list.mockImplementation(async (p) =>
    p.limit === 1 ? { items: [], total: 1, page: 1 } : { items: [task], total: 1, page: 1 }
  );
});

describe("useTasks", () => {
  it("loads tasks and stats", async () => {
    const { result } = renderHook(() => useTasks({}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([task]);
    expect(result.current.stats).toEqual({ todo: 1, in_progress: 1, done: 1 });
  });

  it("exposes an error when loading fails", async () => {
    tasksApi.list.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useTasks({}));
    await waitFor(() => expect(result.current.error?.message).toBe("boom"));
  });

  it("optimistically changes status and rolls back on failure", async () => {
    const { result } = renderHook(() => useTasks({}));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let reject;
    tasksApi.update.mockImplementation(() => new Promise((_, r) => (reject = r)));
    let promise;
    act(() => {
      promise = result.current.changeStatus("1", "done").catch((e) => e);
    });
    await waitFor(() => expect(result.current.items[0].status).toBe("done"));

    await act(async () => {
      reject(new Error("fail"));
      await promise;
    });
    expect(result.current.items[0].status).toBe("todo");
  });
});

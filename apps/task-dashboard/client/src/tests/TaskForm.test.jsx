import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TaskForm, { validateTask } from "../components/TaskForm.jsx";

describe("TaskForm", () => {
  it("shows an error and does not submit when the title is empty", async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(screen.getByText("Enter a title.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed values", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Title"), "  Pay rent ");
    await userEvent.selectOptions(screen.getByLabelText("Priority"), "high");
    await userEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Pay rent", description: "", status: "todo", priority: "high", dueDate: null,
    });
  });

  it("shows the server error when submit fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server said no"));
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Title"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server said no");
  });

  it("validateTask flags long titles", () => {
    expect(validateTask({ title: "a".repeat(121), description: "", dueDate: "" }).title).toMatch(/120/);
  });
});

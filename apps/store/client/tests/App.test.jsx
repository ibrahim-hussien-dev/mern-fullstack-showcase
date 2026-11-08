import { render, screen } from "@testing-library/react";
import App from "../src/App.jsx";

it("renders the page heading inside a main landmark", () => {
  render(<App />);
  expect(screen.getByRole("main")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
});

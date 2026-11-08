import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockUser = { _id: "u1" };
vi.mock("../context/AuthContext.jsx", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("../api/cart.js", () => ({ getCart: vi.fn(), putItem: vi.fn(), clearCart: vi.fn() }));

import * as cartApi from "../api/cart.js";
import { CartProvider, useCart } from "../context/CartContext.jsx";

const line = (qty) => ({ product: { _id: "p1", name: "Mug", priceCents: 1200, stock: 5 }, qty });

function Probe() {
  const c = useCart();
  return (
    <div>
      <span data-testid="count">{c.count}</span>
      <span data-testid="subtotal">{c.cart.subtotal}</span>
      <span data-testid="status">{c.status}</span>
      <button onClick={() => c.addItem("p1")}>add</button>
      <button onClick={() => c.removeItem("p1")}>remove</button>
    </div>
  );
}
const mount = () => render(<CartProvider><Probe /></CartProvider>);

describe("CartContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { _id: "u1" };
  });

  it("loads the server cart for the signed-in user", async () => {
    cartApi.getCart.mockResolvedValue({ items: [line(2)], subtotal: 2400 });
    mount();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));
    expect(screen.getByTestId("subtotal")).toHaveTextContent("2400");
  });

  it("syncs add and remove through the API and uses the server response", async () => {
    cartApi.getCart.mockResolvedValue({ items: [line(1)], subtotal: 1200 });
    cartApi.putItem
      .mockResolvedValueOnce({ items: [line(2)], subtotal: 2400 })
      .mockResolvedValueOnce({ items: [], subtotal: 0 });
    mount();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));

    fireEvent.click(screen.getByText("add"));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));
    expect(cartApi.putItem).toHaveBeenLastCalledWith("p1", 2);

    fireEvent.click(screen.getByText("remove"));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
    expect(cartApi.putItem).toHaveBeenLastCalledWith("p1", 0);
  });

  it("does not fetch a cart when logged out", async () => {
    mockUser = null;
    mount();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("idle"));
    expect(cartApi.getCart).not.toHaveBeenCalled();
  });
});

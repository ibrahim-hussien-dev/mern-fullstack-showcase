import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Orders from "./pages/Orders.jsx";

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main" className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={guard(<Cart />)} />
          <Route path="/checkout" element={guard(<Checkout />)} />
          <Route path="/order-success" element={guard(<OrderSuccess />)} />
          <Route path="/orders" element={guard(<Orders />)} />
          <Route path="*" element={<p className="empty">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}

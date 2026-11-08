import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="container bar">
        <Link to="/" className="brand">Store</Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            <li><NavLink to="/" end>Shop</NavLink></li>
            {user && <li><NavLink to="/orders">Orders</NavLink></li>}
            <li>
              <NavLink to="/cart">
                Cart
                {user && count > 0 && <span className="pill" aria-label={`${count} items in cart`}>{count}</span>}
              </NavLink>
            </li>
            {user ? (
              <li className="who">
                <span className="muted">{user.name}</span>
                <button type="button" className="btn btn-ghost" onClick={onLogout}>Log out</button>
              </li>
            ) : (
              <>
                <li><NavLink to="/login">Log in</NavLink></li>
                <li><Link to="/register" className="btn btn-primary">Create account</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

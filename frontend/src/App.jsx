import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMenu, fetchOrders, submitOrder, MAX_QTY, MIN_QTY, formatRM } from "./api.js";
import DrinkCard from "./components/DrinkCard.jsx";
import CategoryFilter from "./components/CategoryFilter.jsx";
import ShoppingCart from "./components/ShoppingCart.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import ParallaxBackdrop from "./components/ParallaxBackdrop.jsx";
import ScrollProgress from "./components/ScrollProgress.jsx";
import Hero from "./components/Hero.jsx";

// Presentation-only metadata keyed by drink id from the backend menu.
const DRINK_META = {
  espresso: { emoji: "☕", category: "Coffee" },
  americano: { emoji: "🥤", category: "Coffee" },
  latte: { emoji: "☕", category: "Coffee" },
  cappuccino: { emoji: "☕", category: "Coffee" },
  matcha: { emoji: "🍵", category: "Tea" },
  "teh-tarik": { emoji: "🧋", category: "Tea" },
};

const withMeta = (drink) => ({
  ...drink,
  emoji: DRINK_META[drink.id]?.emoji ?? "🥤",
  category: DRINK_META[drink.id]?.category ?? "Other",
});

// Base path (set by Vite) keeps links working both locally at / and on
// GitHub Pages at /coffee-trial/. The staff route also accepts ?p=/staff
// from the GitHub Pages 404-redirect trick.
const BASE = import.meta.env.BASE_URL;
const staffHref = `${BASE}staff`.replace(/([^:])\/\//g, "$1/");
const isStaffRoute = () => {
  const params = new URLSearchParams(window.location.search);
  return (
    window.location.pathname.endsWith("/staff") ||
    params.get("p") === "/staff"
  );
};

function Storefront() {
  const [drinks, setDrinks] = useState([]);
  const [menuError, setMenuError] = useState(null);
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState("All");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersError(null);
      setOrders(await fetchOrders());
    } catch (e) {
      setOrdersError(e.message);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu()
      .then((menu) => setDrinks(menu.map(withMeta)))
      .catch((e) => setMenuError(e.message));
    loadOrders();
  }, [loadOrders]);

  const categories = useMemo(
    () => [...new Set(drinks.map((d) => d.category))],
    [drinks],
  );
  const visibleDrinks = useMemo(
    () => (category === "All" ? drinks : drinks.filter((d) => d.category === category)),
    [drinks, category],
  );

  const changeQty = (id, delta) => {
    setFeedback(null);
    setCart((prev) => {
      const next = Math.min(MAX_QTY, Math.max(MIN_QTY, (prev[id] || 0) + delta));
      return { ...prev, [id]: next };
    });
  };

  // The submitting flag is the duplicate-submission guard: the button is
  // disabled and placeOrder returns early while a request is in flight.
  const placeOrder = async () => {
    if (submitting) return;
    const items = drinks
      .map((d) => ({ drink_id: d.id, qty: cart[d.id] || 0 }))
      .filter((it) => it.qty > 0);
    if (items.length === 0) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const order = await submitOrder(items);
      setCart({});
      setFeedback({
        type: "ok",
        text: `Order #${order.order_id} placed — total ${formatRM(order.total)}`,
      });
      loadOrders();
    } catch (e) {
      setFeedback({ type: "error", text: `Order failed: ${e.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ParallaxBackdrop />
      <ScrollProgress />
      <div className="app">
        <header className="app-header">
          <h1>Kedai Kopi</h1>
          <a className="staff-link" href={staffHref}>Staff view</a>
        </header>

        <Hero />

        {menuError && (
          <div className="error-banner">
            Cannot load the menu: {menuError} — is the backend running on port 8000?
          </div>
        )}

        <section className="panel menu-panel" aria-label="Order section">
          <div className="layout">
            <section className="menu-section" aria-label="Menu">
              <CategoryFilter categories={categories} active={category} onSelect={setCategory} />
              <div className="drink-grid">
                {visibleDrinks.map((d) => (
                  <DrinkCard
                    key={d.id}
                    drink={d}
                    qty={cart[d.id] || 0}
                    onIncrease={() => changeQty(d.id, +1)}
                    onDecrease={() => changeQty(d.id, -1)}
                  />
                ))}
              </div>
            </section>

            <ShoppingCart
              drinks={drinks}
              cart={cart}
              submitting={submitting}
              feedback={feedback}
              onPlaceOrder={placeOrder}
            />
          </div>
        </section>

        <section className="interlude" aria-hidden="true">
          <p className="interlude-quote">
            “Every bean has a story — <em>scroll</em> through ours.”
          </p>
        </section>

        <section className="panel history-panel" aria-label="Order history">
          <h2>Order history</h2>
          <OrderHistory orders={orders} loading={ordersLoading} error={ordersError} />
        </section>

        <footer className="app-footer">
          <span>Kedai Kopi — brewed with ♥ and parallax</span>
          <span className="muted">Demo storefront · orders stored in SQLite</span>
        </footer>
      </div>
    </>
  );
}

function StaffPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchOrders());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="staff-app">
      <h1>Staff — Order History</h1>
      <p className="subtitle">All submitted orders (demo, no login)</p>
      <div className="staff-toolbar">
        <a className="back-link" href={BASE}>← Back to storefront</a>
        <button type="button" className="refresh-btn" onClick={load}>Refresh</button>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <div className="error-banner">Cannot reach the server: {error}</div>}
      {!loading && !error && orders.length === 0 && <p className="muted">No orders yet.</p>}
      {orders.map((o) => (
        <article className="order-card" key={o.order_id}>
          <div className="top">
            <span className="order-id">Order #{o.order_id}</span>
            <span className="order-total">{formatRM(o.total)}</span>
          </div>
          <div className="when">{o.created_at}</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit price</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.drink_name}</td>
                  <td>{formatRM(it.unit_price)}</td>
                  <td>{it.qty}</td>
                  <td>{formatRM(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const isStaff = isStaffRoute();
  return isStaff ? <StaffPage /> : <Storefront />;
}

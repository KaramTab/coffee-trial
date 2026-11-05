import { formatRM } from "../api.js";

export default function OrderHistory({ orders, loading, error }) {
  if (loading) return <p className="muted">Loading order history…</p>;
  if (error) return <p className="muted">Order history unavailable: {error}</p>;
  if (orders.length === 0) return <p className="muted">No orders yet.</p>;

  return (
    <div className="history-list">
      {orders.map((o) => (
        <article className="history-card" key={o.order_id}>
          <div className="top">
            <span>Order #{o.order_id}</span>
            <span>{formatRM(o.total)}</span>
          </div>
          <div className="when">{o.created_at}</div>
          <ul>
            {o.items.map((it, i) => (
              <li key={i}>
                <span>{it.drink_name} × {it.qty}</span>
                <span>{formatRM(it.subtotal)}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

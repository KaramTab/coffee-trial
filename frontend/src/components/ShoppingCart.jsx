import { formatRM } from "../api.js";

export default function ShoppingCart({ drinks, cart, submitting, feedback, onPlaceOrder }) {
  const lines = drinks
    .map((d) => ({ ...d, qty: cart[d.id] || 0 }))
    .filter((d) => d.qty > 0);
  const total = lines.reduce((sum, d) => sum + d.price * d.qty, 0);
  const count = lines.reduce((sum, d) => sum + d.qty, 0);

  return (
    <aside className="cart" aria-label="Shopping cart">
      <h2>Cart ({count})</h2>
      {lines.length === 0 ? (
        <p className="cart-empty">Your cart is empty — add some drinks!</p>
      ) : (
        <div className="cart-lines">
          {lines.map((d) => (
            <div className="cart-line" key={d.id}>
              <span>{d.name} × {d.qty}</span>
              <span className="line-total">{formatRM(d.price * d.qty)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="cart-total-row">
        <span className="label">Total</span>
        <span className="value">{formatRM(total)}</span>
      </div>
      <button
        type="button"
        className={"place-btn" + (submitting ? " submitting" : "")}
        disabled={count === 0 || submitting}
        onClick={onPlaceOrder}
      >
        {submitting ? "Placing order…" : "Place Order"}
      </button>
      {feedback && (
        <p className={"feedback " + (feedback.type === "error" ? "err" : "ok")} role="status">
          {feedback.text}
        </p>
      )}
    </aside>
  );
}

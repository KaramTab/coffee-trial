export const MIN_QTY = 0;
export const MAX_QTY = 20;

export const formatRM = (amount) => "RM" + Number(amount).toFixed(2);

// Fallback menu used when the FastAPI backend is not reachable (e.g. the
// static GitHub Pages deployment). Prices mirror main.py exactly.
const DEMO_MENU = [
  { id: "espresso", name: "Espresso", price: 10 },
  { id: "americano", name: "Americano", price: 9 },
  { id: "latte", name: "Latte", price: 12 },
  { id: "cappuccino", name: "Cappuccino", price: 13 },
  { id: "matcha", name: "Matcha Latte", price: 15 },
  { id: "teh-tarik", name: "Teh Tarik", price: 8 },
];

// In-memory demo orders for the static deployment — nothing is persisted.
const demoOrders = [];
let demoNextId = 1;

async function apiAvailable() {
  try {
    const res = await fetch("/api/menu");
    return res.ok;
  } catch {
    return false;
  }
}

let backendCheck = null;
const hasBackend = () => {
  if (!backendCheck) backendCheck = apiAvailable();
  return backendCheck;
};

export async function fetchMenu() {
  if (await hasBackend()) {
    const res = await fetch("/api/menu");
    if (!res.ok) throw new Error(`Menu request failed (${res.status})`);
    const data = await res.json();
    return data.menu;
  }
  return DEMO_MENU;
}

export async function fetchOrders() {
  if (await hasBackend()) {
    const res = await fetch("/api/orders");
    if (!res.ok) throw new Error(`Order history request failed (${res.status})`);
    const data = await res.json();
    return data.orders;
  }
  return [...demoOrders].sort((a, b) => b.order_id - a.order_id);
}

export async function submitOrder(items) {
  if (await hasBackend()) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      let detail = `Order request failed (${res.status})`;
      try {
        const err = await res.json();
        if (typeof err.detail === "string") detail = err.detail;
        else if (Array.isArray(err.detail)) {
          detail = err.detail.map((d) => d.msg).join("; ");
        }
      } catch {
        /* keep the generic message */
      }
      throw new Error(detail);
    }
    return res.json();
  }

  // Demo mode (static hosting): build the order locally. The total is still
  // recomputed here rather than trusted from the caller.
  const menuById = Object.fromEntries(DEMO_MENU.map((d) => [d.id, d]));
  const prepared = [];
  let total = 0;
  for (const it of items) {
    const drink = menuById[it.drink_id];
    if (!drink) throw new Error(`Unknown drink: ${it.drink_id}`);
    const subtotal = drink.price * it.qty;
    total += subtotal;
    prepared.push({
      drink_id: drink.id,
      drink_name: drink.name,
      qty: it.qty,
      unit_price: drink.price,
      subtotal,
    });
  }
  const order = {
    order_id: demoNextId++,
    total,
    created_at: new Date().toLocaleString(),
    items: prepared,
  };
  demoOrders.push(order);
  return order;
}

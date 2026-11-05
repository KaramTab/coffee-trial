from pathlib import Path

import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

APP_DIR = Path(__file__).parent
DB_PATH = APP_DIR / "orders.db"

# Single source of truth for prices: the browser never sends a total,
# the server always recalculates from these values.
MENU = [
    {"id": "espresso", "name": "Espresso", "price": 10},
    {"id": "americano", "name": "Americano", "price": 9},
    {"id": "latte", "name": "Latte", "price": 12},
    {"id": "cappuccino", "name": "Cappuccino", "price": 13},
    {"id": "matcha", "name": "Matcha Latte", "price": 15},
    {"id": "teh-tarik", "name": "Teh Tarik", "price": 8},
]
MENU_BY_ID = {d["id"]: d for d in MENU}
MIN_QTY = 0
MAX_QTY = 20


class OrderItem(BaseModel):
    drink_id: str
    qty: int = Field(ge=MIN_QTY, le=MAX_QTY)


class OrderRequest(BaseModel):
    items: list[OrderItem]


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total REAL NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL REFERENCES orders(id),
                drink_id TEXT NOT NULL,
                drink_name TEXT NOT NULL,
                qty INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                subtotal REAL NOT NULL
            );
            """
        )


app = FastAPI(title="Drink Order Demo")
init_db()


@app.get("/api/menu")
def get_menu():
    return {"menu": MENU}


@app.post("/api/orders")
def create_order(req: OrderRequest):
    items = [it for it in req.items if it.qty > 0]
    if not items:
        raise HTTPException(status_code=400, detail="Order must contain at least one drink")

    total = 0.0
    prepared = []
    for it in items:
        drink = MENU_BY_ID.get(it.drink_id)
        if drink is None:
            raise HTTPException(status_code=400, detail=f"Unknown drink: {it.drink_id}")
        subtotal = drink["price"] * it.qty
        total += subtotal
        prepared.append((it.drink_id, drink["name"], it.qty, drink["price"], subtotal))

    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute("INSERT INTO orders (total) VALUES (?)", (total,))
        order_id = cur.lastrowid
        conn.executemany(
            "INSERT INTO order_items (order_id, drink_id, drink_name, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
            [(order_id, *row) for row in prepared],
        )

    return {"order_id": order_id, "total": total, "items": [
        {"drink_id": d, "name": n, "qty": q, "unit_price": p, "subtotal": s}
        for d, n, q, p, s in prepared
    ]}


@app.get("/api/orders")
def list_orders():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        orders = conn.execute("SELECT id, total, created_at FROM orders ORDER BY id DESC").fetchall()
        result = []
        for o in orders:
            rows = conn.execute(
                "SELECT drink_id, drink_name, qty, unit_price, subtotal FROM order_items WHERE order_id = ?",
                (o["id"],),
            ).fetchall()
            result.append({
                "order_id": o["id"],
                "total": o["total"],
                "created_at": o["created_at"],
                "items": [dict(r) for r in rows],
            })
        return {"orders": result}


@app.get("/")
def customer_page():
    return FileResponse(APP_DIR / "order.html", media_type="text/html")


@app.get("/admin")
def admin_page():
    return FileResponse(APP_DIR / "admin.html", media_type="text/html")

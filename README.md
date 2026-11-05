# Coffee Trial ☕

A coffee storefront demo: React + Vite front end with a scroll-scrubbed GIF
backdrop, backed by a FastAPI + SQLite order service.

**Live demo:** https://karamtab.github.io/coffee-trial/

> The GitHub Pages build runs in demo mode (built-in menu, in-memory orders).
> Run the backend locally for the full API experience.

## What's inside

- `frontend/` — React 19 + Vite storefront
  - 6 drinks, category filter, live cart, order history
  - Scroll-scrubbed coffee-beans GIF backdrop (plays forward as you scroll
    down, rewinds as you scroll up, freezes when idle)
- `main.py` — FastAPI backend
  - `GET /api/menu` — the drinks menu (single source of truth for prices)
  - `POST /api/orders` — submit an order; totals recalculated server-side
  - `GET /api/orders` — order history
  - Orders stored in SQLite (`orders.db`)
- `order.html`, `admin.html` — original single-file versions (served by the
  backend at `/` and `/admin`)

## Run locally

Backend (port 8000):

```bash
python -m venv venv
venv/Scripts/python -m pip install fastapi uvicorn
venv/Scripts/python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend (port 5173, proxies /api to the backend):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the storefront at `http://127.0.0.1:8000/`
serves the original plain-HTML version, and `/admin` is the staff view.

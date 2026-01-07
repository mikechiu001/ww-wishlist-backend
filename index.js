import express from "express";

const app = express();

/**
 * Parse JSON body
 */
app.use(express.json({ limit: "1mb" }));

/**
 * CORS: allow Shopify storefront to call this backend
 * (We can lock this down later.)
 */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/**
 * In-memory wishlist store (POC)
 * key: list_id
 * val: array of product gids (strings)
 */
const WISHLISTS = new Map();

/**
 * Health check (JSON)
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "ww-wishlist-backend",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root
 */
app.get("/", (req, res) => {
  res.send("WW Wishlist Backend is running.");
});

/**
 * Save wishlist
 * POST /api/wishlist/save
 * Body: { list_id: "abc", items: ["gid://shopify/Product/123", ...] }
 */
app.post("/api/wishlist/save", (req, res) => {
  const body = req.body || {};
  const list_id = String(body.list_id || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!list_id) {
    return res.status(400).json({ ok: false, error: "Missing list_id" });
  }

  // sanitize + unique
  const out = [];
  const seen = new Set();
  for (const it of items) {
    const s = String(it || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }

  WISHLISTS.set(list_id, out);
  return res.json({ ok: true, list_id, count: out.length });
});

/**
 * Get wishlist
 * GET /api/wishlist/get?list_id=abc
 */
app.get("/api/wishlist/get", (req, res) => {
  const list_id = String(req.query.list_id || "").trim();
  if (!list_id) {
    return res.status(400).json({ ok: false, error: "Missing list_id" });
  }
  const items = WISHLISTS.get(list_id) || [];
  return res.json({ ok: true, list_id, items });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

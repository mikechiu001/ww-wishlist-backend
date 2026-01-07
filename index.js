import express from "express";

const app = express();

/**
 * Basic JSON body parser
 */
app.use(express.json({ limit: "1mb" }));

/**
 * Simple CORS (so Shopify storefront can call this API)
 * For now we allow all origins to avoid setup friction.
 * We can lock it down later to your domain.
 */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/**
 * In-memory store (temporary)
 * Key = list_id, Value = array of item ids/handles
 */
const store = new Map();

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("WW Wishlist Backend is running.");
});

/**
 * Save wishlist
 * POST /wishlist
 * Body: { list_id: "some-id", items: ["gid://shopify/Product/...", "..."] }
 */
app.post("/wishlist", (req, res) => {
  const body = req.body || {};
  const list_id = String(body.list_id || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!list_id) {
    return res.status(400).json({ ok: false, error: "Missing list_id" });
  }

  // Basic sanitize: keep only strings, unique
  const clean = [];
  const seen = new Set();
  for (const it of items) {
    const s = String(it || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    clean.push(s);
  }

  store.set(list_id, clean);
  return res.json({ ok: true, list_id, count: clean.length });
});

/**
 * Load wishlist
 * GET /wishlist?list_id=some-id
 */
app.get("/wishlist", (req, res) => {
  const list_id = String(req.query.list_id || "").trim();
  if (!list_id) {
    return res.status(400).json({ ok: false, error: "Missing list_id" });
  }
  const items = store.get(list_id) || [];
  return res.json({ ok: true, list_id, items });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

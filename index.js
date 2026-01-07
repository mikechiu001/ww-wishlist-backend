'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

/**
 * CORS: allow Shopify storefront + dev tools to call this API.
 * For now, allow all origins to keep POC simple/stable.
 * (Later we can lock it down to your domain.)
 */
app.use(cors());
app.use(express.json({ limit: '1mb' }));

/**
 * In-memory store (POC)
 * Shape:
 *   wishlistStore[list_id] = [ {handle, variant_id, title, url, image, price, ...}, ... ]
 */
const wishlistStore = Object.create(null);

/**
 * Helpers
 */
function toCleanString(v) {
  return String(v || '').trim();
}

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  return res.json({
    ok: true,
    service: 'ww-wishlist-backend',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Save wishlist items (overwrite strategy)
 * POST /api/wishlist/save
 * Body: { list_id: "xxx", items: [ {...}, {...} ] }
 */
app.post('/api/wishlist/save', (req, res) => {
  try {
    const body = req.body || {};
    const list_id = toCleanString(body.list_id);

    if (!list_id) {
      return res.status(400).json({ ok: false, error: 'list_id_required' });
    }

    const items = Array.isArray(body.items) ? body.items : [];

    // IMPORTANT: store objects as-is (do NOT stringify)
    wishlistStore[list_id] = items;

    return res.json({ ok: true, list_id, count: items.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'save_failed' });
  }
});

/**
 * Get wishlist items
 * GET /api/wishlist/get?list_id=xxx
 */
app.get('/api/wishlist/get', (req, res) => {
  try {
    const list_id = toCleanString(req.query.list_id);

    if (!list_id) {
      return res.status(400).json({ ok: false, error: 'list_id_required' });
    }

    const items = Array.isArray(wishlistStore[list_id]) ? wishlistStore[list_id] : [];

    return res.json({ ok: true, list_id, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'get_failed' });
  }
});

/**
 * Optional: clear a list (useful for testing)
 * POST /api/wishlist/clear
 * Body: { list_id: "xxx" }
 */
app.post('/api/wishlist/clear', (req, res) => {
  try {
    const body = req.body || {};
    const list_id = toCleanString(body.list_id);

    if (!list_id) {
      return res.status(400).json({ ok: false, error: 'list_id_required' });
    }

    delete wishlistStore[list_id];
    return res.json({ ok: true, list_id, count: 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'clear_failed' });
  }
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`WW Wishlist Backend listening on port ${PORT}`);
});

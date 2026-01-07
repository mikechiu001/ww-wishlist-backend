'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

// CORS: POC 先開放全部 origin（之後再鎖到你 Shopify domain）
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// In-memory store (POC)
// wishlistStore[list_id] = [ { ...itemObject }, ... ]
const wishlistStore = Object.create(null);

function cleanString(v) {
  return String(v || '').trim();
}

// Health
app.get('/api/health', (req, res) => {
  return res.json({
    ok: true,
    service: 'ww-wishlist-backend',
    timestamp: new Date().toISOString()
  });
});

// Save (overwrite full list)
app.post('/api/wishlist/save', (req, res) => {
  try {
    const body = req.body || {};
    const list_id = cleanString(body.list_id);

    if (!list_id) {
      return res.status(400).json({ ok: false, error: 'list_id_required' });
    }

    const items = Array.isArray(body.items) ? body.items : [];

    // IMPORTANT: store objects as-is (no stringify)
    wishlistStore[list_id] = items;

    return res.json({ ok: true, list_id, count: items.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'save_failed' });
  }
});

// Get
app.get('/api/wishlist/get', (req, res) => {
  try {
    const list_id = cleanString(req.query.list_id);

    if (!list_id) {
      return res.status(400).json({ ok: false, error: 'list_id_required' });
    }

    const items = Array.isArray(wishlistStore[list_id]) ? wishlistStore[list_id] : [];
    return res.json({ ok: true, list_id, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'get_failed' });
  }
});

// Clear (testing helper)
app.post('/api/wishlist/clear', (req, res) => {
  try {
    const body = req.body || {};
    const list_id = cleanString(body.list_id);

    if (!list_id) {
      return res.status(400).json({ ok: false, error: 'list_id_required' });
    }

    delete wishlistStore[list_id];
    return res.json({ ok: true, list_id, count: 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'clear_failed' });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WW Wishlist Backend listening on port ${PORT}`);
});

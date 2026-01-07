import express from "express";

const app = express();

// health check (JSON)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "ww-wishlist-backend",
    timestamp: new Date().toISOString(),
  });
});

// root
app.get("/", (req, res) => {
  res.send("WW Wishlist Backend is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

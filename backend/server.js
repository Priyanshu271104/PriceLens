// backend/server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5005;
const SERP_API_KEY = process.env.SERP_API_KEY;

// Fail fast if a required secret is missing (prevents runtime surprises)
if (!SERP_API_KEY) {
  console.error("FATAL: SERP_API_KEY environment variable is not set.");
  process.exit(1);
}

// security middlewares
app.use(helmet());

// rate limiter (configurable via env)
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// configurable allowed origins
const FRONTEND_ORIGINS = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        console.info(
          "[CORS] request with no Origin — allowing (server/CLI usage)."
        );
        return callback(null, true);
      }
      if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
      console.warn(`[CORS] blocked origin: ${origin}`);
      return callback(
        new Error("CORS policy: This origin is not allowed"),
        false
      );
    },
    credentials: true,
  })
);

// limit JSON body size
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.json({ status: "ok" }));

app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  if (!q || String(q).trim().length === 0) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  if (q.length > 200) {
    return res
      .status(400)
      .json({ error: "Query too long (max 200 characters)." });
  }

  console.log(
    `[${new Date().toISOString()}] Searching for: ${q} from ${req.ip}`
  );

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q,
        location: "India",
        google_domain: "google.co.in",
        gl: "in",
        hl: "en",
        api_key: SERP_API_KEY,
      },
      timeout: 15000,
    });

    const data = response.data || {};
    const rawResults = [
      ...(Array.isArray(data.shopping_results) ? data.shopping_results : []),
      ...(Array.isArray(data.product_results) ? data.product_results : []),
      ...(Array.isArray(data.inline_shopping_results)
        ? data.inline_shopping_results
        : []),
      ...(Array.isArray(data.organic_results) ? data.organic_results : []),
    ].slice(0, 20);

    const products = rawResults.map((item, idx) => {
      const title =
        item.title ||
        item.title_with_highlights ||
        item.snippet ||
        item.headline ||
        item.product_title ||
        `Result ${idx + 1}`;

      const thumbnail =
        item.thumbnail ||
        item.thumbnail_url ||
        item.image ||
        item.product_thumbnail ||
        "";

      const rawLink =
        item.link ||
        item.product_link ||
        item.source_link ||
        item.shopping_link ||
        (item.store && item.store.link) ||
        "";

      const link =
        rawLink ||
        `https://www.google.com/search?q=${encodeURIComponent(title)}`;

      const priceRaw =
        item.price ||
        item.extracted_price ||
        item.price_string ||
        item.product_price ||
        item.inline_price ||
        "";

      const price = extractPrice(priceRaw) || 0;

      return {
        id:
          item.product_id ||
          item.position ||
          item.gid ||
          `${Date.now()}-${idx}`,
        name: title,
        image: thumbnail || "",
        rating: item.rating || item.stars || 4.5,
        reviews: item.reviews || item.review_count || 0,
        category: item.category || "Electronics",
        currentPrice: price,
        stores: [
          {
            name: item.source || (item.store && item.store.name) || "Unknown",
            price: price,
            logo: getStoreInitials(item.source || ""),
            color: "text-blue-600",
            link: link,
          },
        ],
        history: generateMockHistory(price),
      };
    });

    return res.json(products);
  } catch (error) {
    console.error(
      "[API] Error fetching SerpApi:",
      error.stack || error.message
    );
    if (error.response) {
      console.error(
        "[API] Upstream status:",
        error.response.status,
        error.response.data || ""
      );
      if (error.response.status === 401) {
        return res.status(401).json({ error: "Invalid SerpApi Key." });
      }
    }
    return res.status(502).json({ error: "Upstream search provider error." });
  }
});

// helpers
function extractPrice(priceRaw) {
  if (priceRaw === null || priceRaw === undefined) return 0;
  if (typeof priceRaw === "number") return Math.round(priceRaw);

  const str = String(priceRaw);
  const match = str.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return 0;
  const numeric = match[0].replace(/,/g, "");
  const n = Number(numeric);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function getStoreInitials(name = "") {
  if (!name) return "UNK";
  return name
    .split(" ")
    .map((p) => p[0] || "")
    .slice(0, 3)
    .join("")
    .toUpperCase();
}

function generateMockHistory(price = 0) {
  return [
    {
      date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      price: Math.round(price * 1.05),
    },
    {
      date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      price: Math.round(price * 1.02),
    },
    { date: new Date().toISOString(), price: Math.round(price) },
  ];
}

// start server
const server = app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

// graceful shutdown
process.on("SIGTERM", () => {
  console.info("SIGTERM received: closing HTTP server");
  server.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.info("SIGINT received: closing HTTP server");
  server.close(() => process.exit(0));
});

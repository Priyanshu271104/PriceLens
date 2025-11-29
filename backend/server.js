const express = require("express");
const cors = require("cors");
const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5005;
const SERP_API_KEY = process.env.SERP_API_KEY;

if (!SERP_API_KEY) {
  return res
    .status(500)
    .json({ error: "Server misconfiguration: SERP_API_KEY not set.", code: "SERP_API_KEY_MISSING" });
}


app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// configurable allowed origins
const FRONTEND_ORIGINS = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        console.info('[CORS] request with no Origin — allowing (server/CLI usage).');
        return callback(null, true);
      }
      if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("CORS policy: This origin is not allowed"));
    },
  })
);


app.use(express.json());
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
  if (!SERP_API_KEY) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: SERP_API_KEY not set." });
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
      console.error("[API] Upstream status:", error.response.status);
      if (error.response.status === 401) {
        return res.status(401).json({ error: "Invalid SerpApi Key." });
      }
    }
    // return a clear error to the client
    return res.status(502).json({ error: "Upstream search provider error." });
  }
});

// helper: extractPrice — more robust extraction for common formats
function extractPrice(priceRaw) {
  if (!priceRaw && priceRaw !== 0) return 0;
  if (typeof priceRaw === "number") return Math.round(priceRaw);

  // Try to find a first numeric-like token (handles "₹79,999", "79,999.00", "Rs. 79,999", etc.)
  const str = String(priceRaw);
  // find groups of digits optionally with commas and optional decimal part
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
  // simple 3-point time series (2 months ago, 1 month ago, now)
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

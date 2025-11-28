// server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

// Use env PORT if present, otherwise default to 5005
const PORT = process.env.PORT || 5005;

// Keep the key inline as requested; can be overridden by process.env.SERP_API_KEY
const SERP_API_KEY =
  process.env.SERP_API_KEY ||
  "26c8321ff3d303054cd14dbc971ce695c5fdd401f841e96d375532ec1471c7d5";

if (!SERP_API_KEY) {
  console.warn("WARNING: SERP_API_KEY is empty. SerpApi requests will fail.");
}

// Accept requests from both localhost and 127.0.0.1 (Vite sometimes uses one or the other)
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        // You can log or change this if you want to allow more origins
        return callback(new Error("CORS policy: This origin is not allowed"));
      }
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// simple health-check
app.get("/", (req, res) => res.send("ok"));

// main search endpoint
// main search endpoint (robust/fault-tolerant)
app.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  if (!SERP_API_KEY) {
    // keep this a 500 because it's server misconfiguration
    return res
      .status(500)
      .json({ error: "Server misconfiguration: SERP_API_KEY not set." });
  }

  console.log(`[${new Date().toISOString()}] Searching for: ${q}`);

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
      timeout: 15000, // slightly larger timeout
    });

    const data = response.data || {};

    // Prefer shopping_results, fall back to organic_results for generic queries
    // Combine ALL possible result arrays SerpApi may return
    const rawResults = [
      ...(Array.isArray(data.shopping_results) ? data.shopping_results : []),
      ...(Array.isArray(data.product_results) ? data.product_results : []),
      ...(Array.isArray(data.inline_shopping_results)
        ? data.inline_shopping_results
        : []),
      ...(Array.isArray(data.organic_results) ? data.organic_results : []),
    ].slice(0, 20); // limit to first 20 results for performance

    const products = rawResults.map((item, idx) => {
  // flexible extraction to handle different SerpApi shapes
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

  // try multiple possible link fields, then fallback to a Google search for the title
  const rawLink =
    item.link ||
    item.product_link ||
    item.source_link ||
    item.shopping_link ||
    (item.store && item.store.link) ||
    "";

  const link = rawLink || `https://www.google.com/search?q=${encodeURIComponent(title)}`;

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
    image: thumbnail || "", // frontend will handle empty string with onError fallback
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
        link: link
      }
    ],
    history: generateMockHistory(price)
  };
});

    // Return results (even empty array is acceptable)
    return res.json(products);
  } catch (error) {
    // Always log full context for debugging, but return an empty array (200)
    console.error("[API] Error fetching SerpApi:", error.message);
    if (error.response) {
      console.error("[API] Upstream status:", error.response.status);
      // Truncate large payloads
      const upstream =
        typeof error.response.data === "string"
          ? error.response.data.slice(0, 2000)
          : JSON.stringify(error.response.data || {}).slice(0, 2000);
      console.error("[API] Upstream data (truncated):", upstream);
      if (error.response.status === 401) {
        // keep this specific (invalid key) so devs see authentication problems clearly
        return res.status(401).json({ error: "Invalid SerpApi Key." });
      }
    }

    // For other upstream/network errors return 200 with empty array so frontend uses demo fallback
    return res.status(200).json([]);
  }
});

function extractPrice(priceString) {
  if (!priceString) return 0;
  const s = String(priceString);
  const re = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
  const matches = [...s.matchAll(re)].map((m) => m[0].replace(/,/g, ""));

  if (matches.length === 0) return 0;
  // convert to numbers and keep only finite, positive
  const nums = matches
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (nums.length === 0) return 0;
  // pick the smallest positive number — this avoids concatenated-large numbers
  const candidate = nums.sort((a, b) => a - b)[0];
  // final sanity: if absurdly large ( > 100 million ) treat as 0
  if (candidate > 100_000_000) return 0;
  return Math.round(candidate);
}

function getStoreInitials(storeName) {
  if (!storeName) return "??";
  const s = storeName.toLowerCase();
  if (s.includes("amazon")) return "AMZ";
  if (s.includes("flipkart")) return "FLP";
  if (s.includes("croma")) return "CRO";
  return storeName.substring(0, 3).toUpperCase();
}

function generateMockHistory(currentPrice) {
  if (!currentPrice) return [];
  return [
    { date: "Oct", price: Math.round(currentPrice * 1.1) },
    { date: "Nov", price: Math.round(currentPrice * 1.05) },
    { date: "Dec", price: Math.round(currentPrice * 1.02) },
    { date: "Jan", price: currentPrice },
  ];
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

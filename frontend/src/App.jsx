import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  Star,
  LogOut,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Clock,
  Heart,
} from "lucide-react";
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  initializeFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  addDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// Smart Links demo map (same as your file — shortened here for brevity in comments)
const DEMO_LINKS = {
  "iphone 15": {
    amazon: "https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY",
    flipkart:
      "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac648551528c",
    croma: "https://www.croma.com/apple-iphone-15-128gb-black-/p/300652",
    reliance:
      "https://www.reliancedigital.in/apple-iphone-15-128-gb-black/p/493838405",
  },
  // ...other entries unchanged
};

const getStoreLink = (storeName = "", productName = "") => {
  const lowerName = String(storeName).toLowerCase();
  const lowerProduct = String(productName).toLowerCase();

  const demoKey = Object.keys(DEMO_LINKS).find((key) =>
    lowerProduct.includes(key)
  );

  if (demoKey) {
    if (lowerName.includes("amazon") && DEMO_LINKS[demoKey]["amazon"])
      return DEMO_LINKS[demoKey]["amazon"];
    if (lowerName.includes("flipkart") && DEMO_LINKS[demoKey]["flipkart"])
      return DEMO_LINKS[demoKey]["flipkart"];
    if (lowerName.includes("croma") && DEMO_LINKS[demoKey]["croma"])
      return DEMO_LINKS[demoKey]["croma"];
    if (lowerName.includes("reliance") && DEMO_LINKS[demoKey]["reliance"])
      return DEMO_LINKS[demoKey]["reliance"];
  }

  const q = encodeURIComponent(String(productName || "").trim());

  if (lowerName.includes("amazon")) return `https://www.amazon.in/s?k=${q}`;
  if (lowerName.includes("flipkart"))
    return `https://www.flipkart.com/search?q=${q}`;
  if (lowerName.includes("croma"))
    return `https://www.croma.com/search/?text=${q}`;
  if (lowerName.includes("reliance"))
    return `https://www.reliancedigital.in/search?q=${q}`;

  const storePart = storeName ? `+${encodeURIComponent(storeName)}` : "";
  return `https://www.google.com/search?q=${q}${storePart}`;
};

const enrichProductWithCompetitors = (product = {}) => {
  const storesArr = Array.isArray(product.stores) ? product.stores : [];
  const realStores = storesArr.map((s) => ({
    ...s,
    link: s.link || getStoreLink(s.name, product.name),
    price: typeof s.price === "number" ? s.price : Number(s.price) || 0,
  }));

  if (realStores.length > 1) return { ...product, stores: realStores };

  const basePrice = Number(product.currentPrice) || 0;
  const competitors = [
    { name: "Amazon", logo: "AMZ", color: "text-yellow-600", variance: 0 },
    { name: "Flipkart", logo: "FLP", color: "text-blue-600", variance: 0.02 },
    { name: "Croma", logo: "CRO", color: "text-teal-600", variance: -0.015 },
    { name: "Reliance", logo: "REL", color: "text-red-600", variance: 0.03 },
  ];

  const existingStoreName =
    (realStores[0] && String(realStores[0].name).toLowerCase()) || "";

  const newStores = competitors
    .filter((c) => !existingStoreName.includes(c.name.toLowerCase()))
    .slice(0, 2)
    .map((c) => ({
      name: c.name,
      logo: c.logo,
      color: c.color,
      price: Math.round(basePrice * (1 + c.variance)),
      link: getStoreLink(c.name, product.name),
    }));

  return {
    ...product,
    stores: [...realStores, ...newStores].sort((a, b) => a.price - b.price),
  };
};

const formatINR = (value) => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0";
  try {
    return Math.round(n).toLocaleString("en-IN");
  } catch {
    return String(Math.round(n));
  }
};

const safeNumber = (v) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PriceLensLogo = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:scale-105 transition-transform duration-300"
  >
    {/* SVG content unchanged */}
    <circle cx="50" cy="50" r="40" fill="#fff" />
    <defs>
      <linearGradient id="rimGradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="30%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <linearGradient id="goldGradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#d4af37" />
        <stop offset="40%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#856838" />
      </linearGradient>
      <linearGradient id="glassGradient" x1="20" y1="20" x2="80" y2="80">
        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <g transform="rotate(45, 50, 50)">
      <rect
        x="42"
        y="75"
        width="16"
        height="30"
        rx="4"
        fill="#1e3a8a"
        stroke="#0f172a"
        strokeWidth="1"
      />
      <rect
        x="42"
        y="95"
        width="16"
        height="6"
        rx="2"
        fill="url(#goldGradient)"
      />
      <rect x="42" y="75" width="16" height="3" fill="url(#goldGradient)" />
    </g>
    <circle
      cx="45"
      cy="45"
      r="32"
      stroke="url(#rimGradient)"
      strokeWidth="8"
      fill="white"
    />
    <circle
      cx="45"
      cy="45"
      r="32"
      stroke="#000"
      strokeWidth="1"
      strokeOpacity="0.1"
      fill="none"
    />
    <circle cx="45" cy="45" r="28" fill="url(#glassGradient)" />
    <text
      x="45"
      y="60"
      fontSize="42"
      fontWeight="bold"
      fill="url(#goldGradient)"
      textAnchor="middle"
      fontFamily="serif"
      style={{ filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))" }}
    >
      ₹
    </text>
    <path
      d="M25 25 Q 45 15 65 25"
      stroke="white"
      strokeWidth="2"
      strokeOpacity="0.8"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const ProductDetails = ({
  product = {},
  onBack,
  user,
  onAuthRequest,
  wishlist = [],
  onToggleWishlist,
}) => {
  const enrichedProduct = useMemo(
    () => enrichProductWithCompetitors(product || {}),
    [product]
  );

  const stores = Array.isArray(enrichedProduct.stores)
    ? enrichedProduct.stores
    : [];

  const bestPrice =
    (stores[0] && Number(stores[0].price)) || Number(product.currentPrice) || 0;

  const isWishlisted =
    Array.isArray(wishlist) &&
    wishlist.some(
      (item) =>
        String(item.productId) === String(product.id || product.productId)
    );

  const normalizedHistory = useMemo(() => {
    const hist = Array.isArray(product.history) ? product.history : [];
    return hist.map((h) => {
      let dateLabel = "";
      if (h && h.date) {
        const d = new Date(h.date);
        dateLabel = !isNaN(d)
          ? d.toLocaleDateString("en-IN", { month: "short" })
          : String(h.date);
      }
      return {
        ...h,
        date: dateLabel,
        price: typeof h.price === "number" ? h.price : Number(h.price) || 0,
      };
    });
  }, [JSON.stringify(product.history || [])]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center justify-center min-h-[300px]">
              {product.image ? (
                <img
                  loading="lazy"
                  src={product.image || "/placeholder.png"}
                  alt={product.name || "product"}
                  className="max-w-full max-h-[300px] object-contain hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />
              ) : (
                <div className="text-8xl">📱</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => onToggleWishlist?.(product)}
                className={`flex items-center justify-center p-4 rounded-xl border shadow-sm transition-all group ${
                  isWishlisted
                    ? "bg-pink-50 border-pink-200 text-pink-600"
                    : "bg-white border-slate-200 text-slate-700 hover:border-pink-200 hover:bg-pink-50"
                }`}
              >
                <Heart
                  className={`w-6 h-6 mr-2 transition-all ${
                    isWishlisted
                      ? "fill-pink-500 text-pink-500"
                      : "text-slate-400 group-hover:text-pink-500"
                  }`}
                />
                <span className="font-bold">
                  {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <ShieldCheck className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Verified
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Authentic Seller
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Update
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Real-time
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                      {product.category}
                    </span>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 font-medium text-slate-700">
                        {product.rating} ({product.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Best Price</p>
                  <p className="text-4xl font-bold text-slate-900">
                    ₹{formatINR(bestPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600" /> Price
                  Comparison
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {stores.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No stores found for this product.
                  </div>
                ) : (
                  stores.map((store, idx) => {
                    const isSearchFallback =
                      store.link && store.link.includes("google.com/search?q=");
                    const stableKey = `${String(store.name || "")
                      .replace(/\s+/g, "-")
                      .toLowerCase()}-${store.price}-${idx}`;
                    return (
                      <div
                        key={stableKey}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-xs font-bold ${store.color} border border-slate-200`}
                          >
                            {store.logo}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {store.name}
                            </p>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Free Delivery
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-6">
                          <div>
                            <p
                              className={`text-xl font-bold ${
                                idx === 0 ? "text-green-600" : "text-slate-900"
                              }`}
                            >
                              ₹{formatINR(safeNumber(store.price))}
                            </p>
                            {idx === 0 && (
                              <p className="text-[10px] text-white bg-green-500 px-2 py-0.5 rounded-full inline-block">
                                Lowest Price
                              </p>
                            )}
                          </div>

                          <a
                            href={store.link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={
                              isSearchFallback
                                ? `Search ${product.name} on ${store.name}`
                                : `Buy ${product.name} on ${store.name}`
                            }
                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            {isSearchFallback ? "Search" : "Buy"}{" "}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Price History
                (3 Months)
              </h3>

              <div className="h-[300px] w-full">
                {normalizedHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    No price history available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={normalizedHistory}>
                      <defs>
                        <linearGradient
                          id="colorHistory"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2563eb"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2563eb"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) =>
                          `₹${formatINR(safeNumber(val) / 1000)}k`
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        itemStyle={{ color: "#2563eb", fontWeight: "bold" }}
                        formatter={(v) => [
                          `₹${formatINR(safeNumber(v))}`,
                          "Price",
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorHistory)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WishlistView = ({
  wishlist = [],
  onBack,
  onSelectProduct,
  onRemove,
  loadingSelection = false,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" /> My Wishlist
        </h2>

        {!Array.isArray(wishlist) || wishlist.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              Your wishlist is empty
            </h3>
            <p className="text-slate-500 mt-2">
              Start tracking prices by adding items to your wishlist.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.docId || product.productId}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-6 border-b border-slate-100 flex justify-center h-48 items-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove?.(product);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all z-10"
                    title="Remove from wishlist"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {product.image ? (
                    <img
                      loading="lazy"
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      className="max-w-full max-h-[300px] object-contain hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />
                  ) : (
                    <div className="text-4xl">📱</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 line-clamp-2 h-12 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Current Price</p>
                      <p className="text-xl font-bold text-slate-900">
                        ₹{formatINR(safeNumber(product.currentPrice))}
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectProduct?.(product)}
                      disabled={!!loadingSelection}
                      className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        loadingSelection ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {loadingSelection ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "View"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(initialMode);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
  }, [isOpen, initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        // keep storing basic profile doc (ok to use setDoc here)
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose?.();
    } catch (err) {
      const code = err.code || "";
      let msg = "Something went wrong.";
      if (code.includes("auth/email-already-in-use"))
        msg = "Email is already registered.";
      else if (code.includes("auth/invalid-email"))
        msg = "Please enter a valid email.";
      else if (code.includes("auth/wrong-password"))
        msg = "Incorrect password.";
      else if (code.includes("auth/user-not-found"))
        msg = "No account found with this email.";
      else msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border rounded-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-slate-50 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-slate-50 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg mt-4 flex justify-center"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        <div className="bg-slate-50 px-8 py-4 border-t text-center text-sm text-slate-600">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-blue-600 font-bold hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Header = ({
  setView,
  user,
  onAuthRequest,
  onLogout,
  onWishlistClick,
  view,
}) => {
  const isHome = view === "home";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 shadow-sm h-16 flex items-center justify-between px-4 md:px-8 lg:px-16 transition-colors duration-300 ${
        isHome ? "bg-white" : "bg-gradient-to-r from-[#1a3c8a] to-[#3b82f6]"
      }`}
    >
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setView("home")}
      >
        <div className="relative flex items-center justify-center">
          <PriceLensLogo />
        </div>
        <span className="text-3xl font-serif font-medium tracking-tight ml-2">
          <span
            className={`${
              isHome
                ? "text-[#333333]"
                : "text-white/90 drop-shadow-sm mix-blend-overlay"
            }`}
          >
            Price
          </span>
          <span className="text-[#a17a35]">Lens</span>
        </span>
      </div>
      <nav className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <button
              onClick={onWishlistClick}
              className={`p-2 rounded-lg transition-all ${
                isHome
                  ? "text-slate-400 hover:text-pink-500 hover:bg-pink-50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              title="My Wishlist"
            >
              <Heart className="w-6 h-6" />
            </button>

            <div className="hidden md:flex flex-col items-end mr-2">
              <span
                className={`text-sm font-bold ${
                  isHome ? "text-slate-900" : "text-white"
                }`}
              >
                {user.displayName || "User"}
              </span>
              <span
                className={`text-xs ${
                  isHome ? "text-slate-500" : "text-blue-100"
                }`}
              >
                {user.email}
              </span>
            </div>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                isHome
                  ? "bg-gradient-to-tr from-blue-500 to-purple-500"
                  : "bg-white/20 border border-white/30"
              }`}
            >
              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className={`p-2 rounded-lg ${
                isHome
                  ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                  : "text-white/80 hover:text-red-300 hover:bg-red-500/20"
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onAuthRequest("login")}
              className={`text-sm font-medium px-2 py-2 ${
                isHome
                  ? "text-slate-600 hover:text-blue-600"
                  : "text-white/90 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => onAuthRequest("signup")}
              className={`px-4 py-2 text-sm font-bold rounded-lg shadow-lg ${
                isHome
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-white text-blue-900 hover:bg-blue-50"
              }`}
            >
              Sign Up
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

const Hero = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState(query);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      onSearch(q);
    } finally {
      setLoading(false);
    }
  };

  const handlePopularClick = (item) => {
    setQuery(item);
    setLoading(true);
    try {
      onSearch(item);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => setQuery("");

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center pt-16 bg-gradient-to-br from-[#1a3c8a] via-[#1e40af] to-[#3b82f6]">
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 w-full max-w-4xl px-6 text-center space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
          Find Better. <br /> Pay Less.
        </h1>
        <p className="text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto font-light">
          Our system scours Amazon, Flipkart, and more to find you the best
          deals in real-time.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mx-auto relative group"
          role="search"
          aria-label="Search products"
        >
          <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-2 transition-transform duration-300 focus-within:scale-[1.01]">
            <Search className="ml-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for products (e.g., iPhone 15)..."
              className="w-full px-4 py-3 text-base text-slate-900 bg-transparent outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Product search"
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="mr-2 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}

            <button
              type="submit"
              disabled={!query.trim() || loading}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-md ${
                !debounced || loading
                  ? "bg-blue-300 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              aria-disabled={!debounced || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-blue-200/80 mt-8">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Popular:</span>
          {["iPhone 15", "Sony WH-1000XM5", "MacBook Air"].map((item) => (
            <button
              key={item}
              onClick={() => handlePopularClick(item)}
              className="hover:text-white hover:underline decoration-blue-300 underline-offset-4 transition-all"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onSelect, loadingSelection = false }) => {
  const storesArr = Array.isArray(product.stores) ? product.stores : [];
  const bestPrice =
    storesArr.length > 0
      ? Math.min(...storesArr.map((s) => Number(s.price || 0)))
      : Number(product.currentPrice || 0);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="p-6 md:w-1/3 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
          {product.image ? (
            <img
              loading="lazy"
              src={product.image || "/placeholder.png"}
              alt={product.name}
              className="max-w-full max-h-[300px] object-contain hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder.png";
              }}
            />
          ) : (
            <div className="text-6xl text-slate-300">📱</div>
          )}
        </div>
        <div className="p-6 md:w-2/3 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs text-slate-500">
                ({product.reviews} reviews)
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500">Best Price</p>
              <p className="text-3xl font-bold text-slate-900">
                ₹{formatINR(safeNumber(bestPrice))}
              </p>
            </div>
            <button
              onClick={() => onSelect?.(product)}
              disabled={loadingSelection}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 ${
                loadingSelection ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loadingSelection ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Compare Prices <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Results = ({
  query,
  onBack,
  onSelectProduct,
  loadingSelection = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5005";

    const fetchData = async () => {
      if (!query || query.trim().length === 0) {
        if (isMounted) {
          setResults([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("API Error");
        }
        const data = await response.json();
        if (isMounted) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Search failed:", err);
        if (isMounted) {
          setResults([
            {
              id: "demo-1",
              name: "Apple iPhone 15 (128 GB)",
              image:
                "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/IPhone_15_logo.svg/800px-IPhone_15_logo.svg.png",
              rating: 4.8,
              reviews: 1240,
              category: "Mobiles",
              currentPrice: 72999,
              stores: [
                {
                  name: "Amazon",
                  price: 72999,
                  logo: "AMZ",
                  color: "text-yellow-600",
                  link: "https://amazon.in",
                },
              ],
              history: [
                { date: "Oct", price: 79900 },
                { date: "Nov", price: 76000 },
                { date: "Jan", price: 72999 },
              ],
            },
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [query]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-16">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 mt-4">Searching stores...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Results for "{query}"
        </h2>
        <div className="space-y-6">
          {results.map((product) => (
            <ProductCard
              key={String(product.id)}
              product={product}
              onSelect={onSelectProduct}
              loadingSelection={loadingSelection}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5005";
  const [view, setView] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setWishlist([]);
      return;
    }

    const wishlistRef = collection(db, "users", currentUser.uid, "wishlist");
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
        // map docs to include Firestore doc id as `docId`
        const items = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
        setWishlist(items);
      });
    } catch (e) {
      console.error("onSnapshot failed:", e);
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [currentUser]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setView("results");
  };
  const [loadingSelection, setLoadingSelection] = useState(false);

  const handleSelectProduct = async (product) => {
    // Prevent duplicate selection requests
    if (loadingSelection) return;

    const normalizeSelected = (p) => {
      if (!p) return null;
      const id = p.id ?? p.productId ?? String(Date.now());

      return { id, ...p };
    };

    setLoadingSelection(true);

    // local abort controller so this call can be cancelled if needed
    const controller = new AbortController();
    try {
      // if product is a wishlist entry (has productId) try fetching by id first
      if (product && product.productId && !product.stores) {
        // Try direct-by-id endpoint first (if your backend supports it)
        let chosen = null;
        try {
          const byIdResp = await fetch(
            `${API_BASE}/api/product/${encodeURIComponent(product.productId)}`,
            { signal: controller.signal }
          );
          if (byIdResp.ok) {
            const byIdData = await byIdResp.json();
            if (byIdData) chosen = byIdData;
          }
        } catch (err) {
          // ignore and fallback to search by name
        }

        // fallback: search by name if by-id didn't return anything
        if (!chosen) {
          try {
            const resp = await fetch(
              `${API_BASE}/api/search?q=${encodeURIComponent(
                product.name || ""
              )}`,
              { signal: controller.signal }
            );
            if (resp.ok) {
              const data = await resp.json();
              if (Array.isArray(data)) {
                chosen =
                  data.find(
                    (p) =>
                      String(p.id) === String(product.productId) ||
                      String(p.id) === String(product.id) ||
                      p.name === product.name
                  ) || null;
              }
            }
          } catch (err) {
            // search failed, we'll fall back below
          }
        }

        setSelectedProduct(normalizeSelected(chosen || product));
      } else {
        // normal result or already-enriched item
        setSelectedProduct(normalizeSelected(product));
      }

      setView("details");
    } catch (e) {
      console.warn(
        "handleSelectProduct: failed to fetch full details, falling back to provided product",
        e
      );
      setSelectedProduct(normalizeSelected(product));
      setView("details");
    } finally {
      setLoadingSelection(false);
    }
  };

  const handleToggleWishlist = async (product) => {
    if (!currentUser) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }

    const originalProductId = String(product.id ?? product.productId ?? "");
    const wishlistRef = collection(db, "users", currentUser.uid, "wishlist");

    // Check if wishlist already contains this product (by productId)
    const existing = Array.isArray(wishlist)
      ? wishlist.find(
          (p) => String(p.productId ?? p.id ?? "") === originalProductId
        )
      : null;

    try {
      if (existing && existing.docId) {
        // delete by Firestore doc id
        await deleteDoc(
          doc(db, "users", currentUser.uid, "wishlist", existing.docId)
        );
      } else {
        // add with auto-id and store original product id under `productId`
        const dataToSave = {
          productId: originalProductId,
          name: product.name,
          image: product.image || "",
          currentPrice: product.currentPrice || 0,
          createdAt: new Date().toISOString(),
          // store only what's needed — avoid huge nested objects unless necessary
        };
        await addDoc(wishlistRef, dataToSave);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  return (
    <div className="font-sans antialiased bg-slate-50 min-h-screen text-slate-900">
      <Header
        setView={setView}
        user={currentUser}
        onAuthRequest={(m) => {
          setAuthMode(m);
          setIsAuthModalOpen(true);
        }}
        onLogout={() =>
          signOut(auth).catch((e) => console.error("Sign out failed", e))
        }
        onWishlistClick={() => setView("wishlist")}
        view={view}
      />

      {view === "home" && <Hero onSearch={handleSearch} />}
      {view === "results" && (
        <Results
          query={searchQuery}
          onBack={() => setView("home")}
          onSelectProduct={handleSelectProduct}
          loadingSelection={loadingSelection}
        />
      )}

      {view === "details" && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onBack={() => setView("results")}
          user={currentUser}
          onAuthRequest={(m) => {
            setAuthMode(m);
            setIsAuthModalOpen(true);
          }}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {view === "wishlist" && (
        <WishlistView
          wishlist={wishlist}
          onBack={() => setView("home")}
          onSelectProduct={handleSelectProduct}
          onRemove={handleToggleWishlist}
          loadingSelection={loadingSelection}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

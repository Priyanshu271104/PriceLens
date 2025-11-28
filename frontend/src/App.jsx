import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  X,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  Star,
  Filter,
  ChevronDown,
  LogOut,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Clock,
  Heart,
  Bell,
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
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJ_41STHuYgDZ8XBJrWxHfwiuJs1Qt4Mk",
  authDomain: "pricelens-b802e.firebaseapp.com",
  projectId: "pricelens-b802e",
  storageBucket: "pricelens-b802e.firebasestorage.app",
  messagingSenderId: "668292203944",
  appId: "1:668292203944:web:ea1e31e097bbb6a693c99d",
};

//Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

//Smart Links
const DEMO_LINKS = {
  "iphone 15": {
    amazon: "https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY",
    flipkart:
      "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac648551528c",
    croma: "https://www.croma.com/apple-iphone-15-128gb-black-/p/300652",
    reliance:
      "https://www.reliancedigital.in/apple-iphone-15-128-gb-black/p/493838405",
  },
  "samsung galaxy s24": {
    amazon:
      "https://www.amazon.in/Samsung-Galaxy-Ultra-Titanium-Storage/dp/B0CS5YGVQ6",
    flipkart:
      "https://www.flipkart.com/samsung-galaxy-s24-ultra-5g-titanium-gray-256-gb/p/itm5a511894a4c47",
    croma:
      "https://www.croma.com/samsung-galaxy-s24-ultra-5g-12gb-ram-256gb-titanium-gray-/p/303539",
  },
  "oneplus 12": {
    amazon:
      "https://www.amazon.in/OnePlus-Flowy-Emerald-512GB-Storage/dp/B0CQPM6YZH",
    flipkart:
      "https://www.flipkart.com/oneplus-12-flowy-emerald-512-gb/p/itm3d25425e982d6",
  },
  "oneplus nord": {
    amazon:
      "https://www.amazon.in/OnePlus-Nord-Lite-Chromatic-Storage/dp/B0BY8MCQ9S",
    flipkart:
      "https://www.flipkart.com/oneplus-nord-ce-3-lite-5g-chromatic-gray-256-gb/p/itm2cd5a4e659035",
    croma:
      "https://www.croma.com/oneplus-nord-ce-3-lite-5g-8gb-ram-256gb-chromatic-gray-/p/270659",
  },
  "samsung galaxy fold": {
    amazon:
      "https://www.amazon.in/Samsung-Galaxy-Fold5-Phantom-Storage/dp/B0CBYD7J4H",
    flipkart:
      "https://www.flipkart.com/samsung-galaxy-z-fold5-5g-phantom-black-512-gb/p/itm2a0468f3077aa",
    croma:
      "https://www.croma.com/samsung-galaxy-z-fold5-5g-12gb-ram-512gb-phantom-black-/p/275553",
  },
  "macbook air": {
    amazon:
      "https://www.amazon.in/Apple-2022-MacBook-Laptop-chip/dp/B0B3B8VCV1",
    flipkart:
      "https://www.flipkart.com/apple-2022-macbook-air-m2-8-gb-256-gb-ssd-mac-os-monterey-mly33hn-a/p/itm0b0a809462217",
  },
  "ipad air": {
    amazon: "https://www.amazon.in/Apple-iPad-Air-11-inch-M2/dp/B0D3J63P6F",
    flipkart:
      "https://www.flipkart.com/apple-ipad-air-6th-gen-11-inch-m2-chip-128-gb-wi-fi-blue/p/itmdb22b404c062c",
  },
  "sony wh-1000xm5": {
    amazon:
      "https://www.amazon.in/Sony-WH-1000XM5-Cancelling-Headphones-Connectivity/dp/B09XS7JWHH",
    flipkart:
      "https://www.flipkart.com/sony-wh-1000xm5-active-noise-cancellation-bluetooth-headset/p/itm9e6df81559e2b",
    croma:
      "https://www.croma.com/sony-wh-1000xm5-bluetooth-headset-with-active-noise-cancellation-mic-black-/p/260064",
  },
  "apple watch": {
    amazon:
      "https://www.amazon.in/Apple-Watch-Smartwatch-Midnight-Aluminum/dp/B0CHX31D61",
    flipkart:
      "https://www.flipkart.com/apple-watch-series-9-gps-41mm-midnight-aluminium-case-sport-band/p/itm9a3d460e4092b",
    croma:
      "https://www.croma.com/apple-watch-series-9-gps-41mm-midnight-aluminium-case-with-midnight-sport-band-s-m-/p/300762",
  },
  ipod: {
    amazon:
      "https://www.amazon.in/Apple-AirPods-Pro-2nd-Generation/dp/B0BDK4Z2K2",
    flipkart:
      "https://www.flipkart.com/apple-airpods-pro-2nd-gen-magsafe-charging-case-usb-c-bluetooth-headset/p/itm3c26cb5c76747",
  },
  airpods: {
    amazon:
      "https://www.amazon.in/Apple-AirPods-Pro-2nd-Generation/dp/B0BDK4Z2K2",
    flipkart:
      "https://www.flipkart.com/apple-airpods-pro-2nd-gen-magsafe-charging-case-usb-c-bluetooth-headset/p/itm3c26cb5c76747",
  },
  "samsung refrigerator": {
    amazon:
      "https://www.amazon.in/Samsung-Convertible-Refrigerator-RT28C3733S8-HL/dp/B0BR4F6F4C",
    flipkart:
      "https://www.flipkart.com/samsung-236-l-frost-free-double-door-2-star-convertible-refrigerator-silver/p/itm4b23d9b0a1d6e",
    croma:
      "https://www.croma.com/samsung-236-litres-2-star-frost-free-double-door-convertible-refrigerator-with-digital-inverter-technology-2023-model-rt28c3733s8-hl-silver-elegant-inam-/p/270425",
  },
  "smart tv": {
    amazon:
      "https://www.amazon.in/Sony-Bravia-inches-Google-KD-55X74L/dp/B0C1HZS3J6",
    flipkart:
      "https://www.flipkart.com/sony-bravia-x74l-138-8-cm-55-inch-ultra-hd-4k-led-smart-google-tv/p/itm5e43f0c103289",
    croma:
      "https://www.croma.com/sony-bravia-x74l-139-cm-55-inch-4k-ultra-hd-led-google-tv-with-x-protection-pro-2023-model-/p/272300",
  },
};

const getStoreLink = (storeName, productName) => {
  const lowerName = storeName.toLowerCase();
  const lowerProduct = productName.toLowerCase();

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

  const q = encodeURIComponent(productName);

  if (lowerName.includes("amazon")) return `https://www.amazon.in/s?k=${q}`;
  if (lowerName.includes("flipkart"))
    return `https://www.flipkart.com/search?q=${q}`;
  if (lowerName.includes("croma"))
    return `https://www.croma.com/search/?text=${q}`;
  if (lowerName.includes("reliance"))
    return `https://www.reliancedigital.in/search?q=${q}`;

  return `https://www.google.com/search?q=${q}+${storeName}`;
};

const enrichProductWithCompetitors = (product) => {
  const realStores = product.stores.map((s) => ({
    ...s,
    link: s.link || getStoreLink(s.name, product.name),
  }));

  if (realStores.length > 1) return { ...product, stores: realStores };

  const basePrice = product.currentPrice;
  const competitors = [
    { name: "Amazon", logo: "AMZ", color: "text-yellow-600", variance: 0 },
    { name: "Flipkart", logo: "FLP", color: "text-blue-600", variance: 0.02 },
    { name: "Croma", logo: "CRO", color: "text-teal-600", variance: -0.015 },
    { name: "Reliance", logo: "REL", color: "text-red-600", variance: 0.03 },
  ];

  const existingStoreName = realStores[0]?.name?.toLowerCase() || "";

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
//Components

const PriceLensLogo = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:scale-105 transition-transform duration-300"
  >
    <defs>
      <linearGradient
        id="rimGradient"
        x1="0"
        y1="0"
        x2="100"
        y2="100"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="30%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <linearGradient
        id="goldGradient"
        x1="0"
        y1="0"
        x2="100"
        y2="100"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#d4af37" />
        <stop offset="40%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#856838" />
      </linearGradient>
      <linearGradient
        id="glassGradient"
        x1="20"
        y1="20"
        x2="80"
        y2="80"
        gradientUnits="userSpaceOnUse"
      >
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
  product,
  onBack,
  user,
  onAuthRequest,
  wishlist,
  onToggleWishlist,
}) => {
  const enrichedProduct = enrichProductWithCompetitors(product);

  const bestPrice =
    (enrichedProduct?.stores &&
      enrichedProduct.stores[0] &&
      enrichedProduct.stores[0].price) ||
    product.currentPrice ||
    0;

  const isWishlisted = wishlist.some((item) => item.id === product.id);

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

          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center justify-center min-h-[300px]">
              {product.image ? (
                <img
                  src={product.image || "/placeholder.png"}
                  alt={product.name}
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

            {/* Wishlist Button */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => onToggleWishlist(product)}
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
                <p className="text-xs text-slate-500 uppercase font-bold">Verified</p>
                <p className="text-sm font-semibold text-slate-900">Authentic Seller</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 uppercase font-bold">Update</p>
                <p className="text-sm font-semibold text-slate-900">Real-time</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Product Header */}
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
                    ₹{bestPrice.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* PRICE COMPARISON */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600" /> Price Comparison
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {enrichedProduct.stores.map((store, idx) => {

                  // ✅ FIX: Define the variable OUTSIDE JSX
                  const isSearchFallback =
                    store.link && store.link.includes("google.com/search?q=");

                  return (
                    <div
                      key={idx}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-xs font-bold ${store.color} border border-slate-200`}
                        >
                          {store.logo}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">{store.name}</p>
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
                            ₹{store.price.toLocaleString("en-IN")}
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
                          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {isSearchFallback ? "Search" : "Buy"}{" "}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HISTORY */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Price History (3 Months)
              </h3>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={product.history}>
                    <defs>
                      <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

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
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ color: "#2563eb", fontWeight: "bold" }}
                      formatter={(v) => [`₹${v.toLocaleString()}`, "Price"]}
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
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


//Wishlist View
const WishlistView = ({ wishlist, onBack, onSelectProduct, onRemove }) => {
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

        {wishlist.length === 0 ? (
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
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-6 border-b border-slate-100 flex justify-center h-48 items-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(product);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all z-10"
                    title="Remove from wishlist"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {product.image ? (
                    <img
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
                        ₹{product.currentPrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectProduct(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                      View
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

// Auth Modal
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
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
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
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center pt-16 bg-gradient-to-br from-[#1a3c8a] via-[#1e40af] to-[#3b82f6]">
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>
      <div className="relative z-10 w-full max-w-4xl px-6 text-center space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
          Find Better. <br /> Pay Less.
        </h1>
        <p className="text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto font-light">
          Our system scours Amazon, Flipkart, and more to find you the best
          deals in real-time.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) onSearch(query);
          }}
          className="w-full max-w-2xl mx-auto relative group"
        >
          <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-2 transition-transform duration-300 focus-within:scale-[1.01]">
            <Search className="ml-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for products (e.g., iPhone 15)..."
              className="w-full px-4 py-3 text-base text-slate-900 bg-transparent outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-md"
            >
              Search
            </button>
          </div>
        </form>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-blue-200/80 mt-8">
          <TrendingUp className="w-4 h-4" />{" "}
          <span className="font-medium">Popular:</span>
          {["iPhone 15", "Sony WH-1000XM5", "MacBook Air"].map((item) => (
            <button
              key={item}
              onClick={() => onSearch(item)}
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

const ProductCard = ({ product, onSelect }) => {
  const bestPrice =
    product.stores.length > 0
      ? Math.min(...product.stores.map((s) => s.price))
      : product.currentPrice;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="p-6 md:w-1/3 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
          {product.image ? (
            <img
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
                ₹{bestPrice.toLocaleString("en-IN")}
              </p>
            </div>
            <button
              onClick={() => onSelect(product)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              Compare Prices <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Results = ({ query, onBack, onSelectProduct }) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5005/api/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        if (isMounted) {
          setResults(data);
          setLoading(false);
        }
      } catch (err) {
        setTimeout(() => {
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
            setLoading(false);
          }
        }, 1000);
      }
    };
    if (query) fetchData();
    return () => {
      isMounted = false;
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
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
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
    const unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data());
      setWishlist(items);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setView("results");
  };
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setView("details");
  };

  const handleToggleWishlist = async (product) => {
    if (!currentUser) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }

    const productRef = doc(
      db,
      "users",
      currentUser.uid,
      "wishlist",
      String(product.id)
    );
    const exists = wishlist.some((p) => String(p.id) === String(product.id));

    try {
      if (exists) {
        await deleteDoc(productRef);
      } else {
        await setDoc(productRef, product);
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
        onLogout={() => signOut(auth)}
        onWishlistClick={() => setView("wishlist")}
        view={view}
      />

      {view === "home" && <Hero onSearch={handleSearch} />}
      {view === "results" && (
        <Results
          query={searchQuery}
          onBack={() => setView("home")}
          onSelectProduct={handleSelectProduct}
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

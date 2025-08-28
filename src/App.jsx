import React, { useEffect, useMemo, useState } from "react";

/* ───────────────── Config ───────────────── */
const OWNER_CODE = "universe and me are all aligned"; // optional owner mode

// Local preview fallback
const FALLBACK_DATA = [
  {
    id: "art-001",
    title: "The Celestial Discovery",
    media: "Oil on canvas",
    size: "80×60 cm",
    price: "€1,200",
    sold: false,
    image: "/art/sample1.jpg",
    tags: ["abstract", "blue"],
  },
  {
    id: "art-002",
    title: "Quiet Orchard",
    media: "Watercolor",
    size: "30×42 cm",
    price: "€350",
    sold: true,
    image: "/art/sample2.jpg",
    tags: ["nature", "green"],
  },
];

/** Add Cloudinary transforms when URL is Cloudinary */
function cldThumb(url, width = 1600) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

export default function App() {
  const [items, setItems] = useState(FALLBACK_DATA);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");
  const [owner, setOwner] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  /* Owner mode via ?owner=... or saved flag */
  useEffect(() => {
    const saved = localStorage.getItem("ownerMode") === "1";
    const code = new URLSearchParams(window.location.search).get("owner");
    if (code && code.toLowerCase().trim() === OWNER_CODE.toLowerCase().trim()) {
      localStorage.setItem("ownerMode", "1");
      setOwner(true);
    } else if (saved) {
      setOwner(true);
    }
  }, []);

  /* Load artworks */
  useEffect(() => {
    fetch("/art.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : FALLBACK_DATA))
      .then((data) => setItems(Array.isArray(data) ? data : FALLBACK_DATA))
      .catch(() => setItems(FALLBACK_DATA));
  }, []);

  /* Tag list */
  const allTags = useMemo(() => {
    const set = new Set();
    items.forEach((it) => it.tags?.forEach((t) => set.add(t)));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  /* Filtered list — note: NO year in search */
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((it) => {
      const passQ =
        !ql ||
        it.title?.toLowerCase().includes(ql) ||
        it.media?.toLowerCase().includes(ql) ||
        it.size?.toLowerCase().includes(ql) ||
        it.tags?.some((t) => t.toLowerCase().includes(ql));
      const passTag = tag === "all" || it.tags?.includes(tag);
      return passQ && passTag;
    });
  }, [items, q, tag]);

  /* Keyboard nav in lightbox */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setActiveIndex(null);
      if (activeIndex !== null) {
        if (e.key === "ArrowLeft") {
          setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        } else if (e.key === "ArrowRight") {
          setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, filtered.length]);

  function enterOwnerCode() {
    const code = window.prompt("Enter owner code:");
    if (!code) return;
    if (code.toLowerCase().trim() === OWNER_CODE.toLowerCase().trim()) {
      localStorage.setItem("ownerMode", "1");
      setOwner(true);
      alert("Owner mode enabled on this browser.");
    } else {
      alert("Incorrect code.");
    }
  }

  return (
    <div className="min-h-screen text-neutral-900">
      {/* BACKGROUND */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <img src="/bg.jpg?v=1" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#d9bf92]/40" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#d9bf92]/80 backdrop-blur border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Left: logo stack */}
          <div className="leading-tight">
            <div className="text-3xl font-extrabold tracking-tight drop-shadow-[1px_1px_0_rgba(0,0,0,0.35)]">
              Xotten
            </div>
            <div className="text-sm text-neutral-900/90 leading-[1.1]">
              Elevated
              <br />
              Paintings
            </div>
          </div>

          {/* Nav */}
          <nav className="ml-8 flex items-center gap-6 text-[0.95rem]">
            <a href="/" className="hover:opacity-80">Home</a>
            <a href="/?tag=sold" className="hover:opacity-80">Portfolio</a>
            <a href="#about" className="hover:opacity-80">About</a>
            <a href="#contact" className="hover:opacity-80">Contact<
::contentReference[oaicite:0]{index=0}

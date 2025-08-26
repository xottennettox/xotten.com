import React, { useEffect, useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────────────────────
const OWNER_CODE = "universe and me are all aligned"; // change whenever you like

// Data fallback so local preview works even before art.json exists
const FALLBACK_DATA = [
  {
    id: "art-001",
    title: "The Celestial Discovery",
    year: 2025,
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
    year: 2024,
    media: "Watercolor",
    size: "30×42 cm",
    price: "€350",
    sold: true,
    image: "/art/sample2.jpg",
    tags: ["nature", "green"],
  },
];

// Add sensible Cloudinary transforms when the URL is a Cloudinary one
function cldThumb(url, width = 1600) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url; // not Cloudinary
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

export default function App() {
  const [items, setItems] = useState(FALLBACK_DATA);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");
  const [owner, setOwner] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null); // ← for the lightbox

  // Owner mode via URL param (?owner=code) or stored flag
  useEffect(() => {
    const saved = localStorage.getItem("ownerMode") === "1";
    const params = new URLSearchParams(window.location.search);
    const code = params.get("owner");
    if (code && code.toLowerCase().trim() === OWNER_CODE.toLowerCase().trim()) {
      localStorage.setItem("ownerMode", "1");
      setOwner(true);
    } else if (saved) {
      setOwner(true);
    }
  }, []);

  // Load art.json when available
  useEffect(() => {
    fetch("/art.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : FALLBACK_DATA))
      .then((data) => setItems(Array.isArray(data) ? data : FALLBACK_DATA))
      .catch(() => setItems(FALLBACK_DATA));
  }, []);

  // Build tag list for filter
  const allTags = useMemo(() => {
    const set = new Set();
    items.forEach((it) => it.tags?.forEach((t) => set.add(t)));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  // Apply search + tag filters
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((it) => {
      const passQ =
        !ql ||
        it.title?.toLowerCase().includes(ql) ||
        it.media?.toLowerCase().includes(ql) ||
        it.size?.toLowerCase().includes(ql) ||
        String(it.year || "").includes(ql) ||
        it.tags?.some((t) => t.toLowerCase().includes(ql));
      const passTag = tag === "all" || it.tags?.includes(tag);
      return passQ && passTag;
    });
  }, [items, q, tag]);

// Keyboard: Esc closes; ← / → navigate when lightbox is open
useEffect(() => {
  function onKey(e) {
    if (e.key === "Escape") setActiveIndex(null);
    if (activeIndex !== null) {
      if (e.key === "ArrowLeft") {
        setActiveIndex(i => (i > 0 ? i - 1 : filtered.length - 1));
      } else if (e.key === "ArrowRight") {
        setActiveIndex(i => (i < filtered.length - 1 ? i + 1 : 0));
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold tracking-tight">Xotten Art</div>
          <div className="ml-auto flex items-center gap-2">
            <input
              className="px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring focus:ring-neutral-200"
              placeholder="Search title, year, media, tag…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-xl border border-neutral-300"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              className="px-3 py-2 rounded-xl border border-neutral-300"
              onClick={enterOwnerCode}
              title="Owner login"
            >
              Owner
            </button>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((it, idx) => (
            <Card key={it.id} item={it} owner={owner} onOpen={() => setActiveIndex(idx)} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} · All works © You.
      </footer>

{/* Lightbox modal */}
{activeIndex !== null && (
  <Lightbox
    item={filtered[activeIndex]}
    onClose={() => setActiveIndex(null)}
    onPrev={() => setActiveIndex(i => (i > 0 ? i - 1 : filtered.length - 1))}
    onNext={() => setActiveIndex(i => (i < filtered.length - 1 ? i + 1 : 0))}
  />
)}

      
    </div>
  );
}

function Card({ item, owner, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group relative text-left bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition cursor-zoom-in"
    >
      <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
        <img
          src={cldThumb(item.image, 1200)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-lg leading-tight flex-1">{item.title}</h3>
          {item.year && <span className="text-sm text-neutral-500">{item.year}</span>}
        </div>
        <div className="mt-1 text-sm text-neutral-600">
          {item.media} {item.size ? <>· {item.size}</> : null}
        </div>
        {item.price && (
          <div className="mt-2 text-sm font-medium">{item.price}</div>
        )}
      </div>

      {/* Owner-only SOLD overlay */}
      {owner && item.sold && (
  <div className="absolute left-0 top-4 -rotate-6 bg-neutral-800 text-white px-3 py-1 text-xs uppercase tracking-wider rounded-r-xl shadow">
    Sold
  </div>
)}

    </button>
  );
}

function Lightbox({ item, onClose, onPrev, onNext }) {
  const src = cldThumb(item.image, 2400);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Prev button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 text-xl shadow flex items-center justify-center select-none"
      >
        ‹
      </button>

      <div
        className="relative max-w-6xl w-full max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={item.title}
          className="w-full h-auto max-h-[90vh] object-contain rounded-xl shadow-2xl"
        />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 bg-white text-neutral-800 rounded-full shadow p-2 hover:scale-105 transition"
          title="Close (Esc)"
        >
          ✕
        </button>

        {/* Caption */}
        <div className="absolute left-0 right-0 -bottom-1 mx-auto w-fit bg-white/90 text-neutral-900 text-sm px-3 py-1 rounded-t-lg shadow">
          {item.title} {item.year ? `· ${item.year}` : ""} {item.size ? `· ${item.size}` : ""}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 text-xl shadow flex items-center justify-center select-none"
      >
        ›
      </button>
    </div>
  );
}


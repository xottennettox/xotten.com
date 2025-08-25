import React, { useEffect, useMemo, useState } from "react";

const OWNER_CODE = "universe and me are all aligned";

const FALLBACK_DATA = [
  {
    id: "art-001",
    title: "Azure Horizon",
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

function cldThumb(url, width = 1600) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url; // not a Cloudinary URL
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

export default function App() {
  const [items, setItems] = useState(FALLBACK_DATA);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");
  const [owner, setOwner] = useState(false);

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

  useEffect(() => {
    fetch("/art.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : FALLBACK_DATA))
      .then((data) => setItems(Array.isArray(data) ? data : FALLBACK_DATA))
      .catch(() => setItems(FALLBACK_DATA));
  }, []);

  const allTags = useMemo(() => {
    const set = new Set();
    items.forEach((it) => it.tags?.forEach((t) => set.add(t)));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

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
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold tracking-tight">My Art Portfolio</div>
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((it) => (
            <Card key={it.id} item={it} owner={owner} />
          ))}
        </div>
      </main>

      <footer className="py-10 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} · All works © You.
      </footer>
    </div>
  );
}

function Card({ item, owner }) {
  const imgSrc = cldThumb(item.image, 1600);
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition">
      <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
        <img
          src={imgSrc}
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

      {owner && item.sold && (
        <>
          <div className="absolute inset-0 bg-neutral-700/35 backdrop-blur-[1px]" />
          <div className="absolute left-0 top-4 -rotate-6 bg-neutral-800 text-white px-3 py-1 text-xs uppercase tracking-wider rounded-r-xl shadow">
            Sold
          </div>
        </>
      )}
    </div>
  );
}

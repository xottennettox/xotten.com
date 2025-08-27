import React, { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Config
   ───────────────────────────────────────────────────────────── */
const OWNER_CODE = "universe and me are all aligned"; // owner mode unlock code
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mpwjwwwb"; // your Formspree id
const DENSITY_KEY = "density_v3";

/* Fallback data so local preview works even if art.json isn’t there yet */
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

/* Cloudinary: add smart transforms if URL is Cloudinary */
function cldThumb(url, width = 1600) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

/* Small helper for hash-based routing (no extra packages needed) */
function useHashRoute(defaultRoute = "gallery") {
  const [route, setRoute] = useState(
    window.location.hash.replace(/^#/, "") || defaultRoute
  );
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, "") || defaultRoute);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultRoute]);
  return [route, (r) => (window.location.hash = r)];
}

export default function App() {
  /* data + filters */
  const [items, setItems] = useState(FALLBACK_DATA);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");

  /* owner mode + prices visibility */
  const [owner, setOwner] = useState(false);

  /* density (thumbnail size) */
  const [density, setDensity] = useState(
    localStorage.getItem(DENSITY_KEY) || "compact"
  );
  useEffect(() => localStorage.setItem(DENSITY_KEY, density), [density]);

  /* lightbox index */
  const [activeIndex, setActiveIndex] = useState(null);

  /* simple routes: gallery (available), portfolio (sold), detail, bio, guestbook, blog, contact */
  const [route, go] = useHashRoute("gallery");

  /* owner mode via ?owner=… or saved flag */
  useEffect(() => {
    const saved = localStorage.getItem("ownerMode") === "1";
    const code = new URLSearchParams(window.location.search).get("owner");
    if (code && code.toLowerCase().trim() === OWNER_CODE.toLowerCase().trim()) {
      localStorage.setItem("ownerMode", "1");
      setOwner(true);
    } else if (saved) setOwner(true);
  }, []);

  /* load art.json */
  useEffect(() => {
    fetch("/art.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : FALLBACK_DATA))
      .then((data) => setItems(Array.isArray(data) ? data : FALLBACK_DATA))
      .catch(() => setItems(FALLBACK_DATA));
  }, []);

  /* tags for filter */
  const allTags = useMemo(() => {
    const set = new Set();
    items.forEach((it) => it.tags?.forEach((t) => set.add(t)));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  /* text search + tag filter (applied in each page) */
  const filterList = (list) => {
    const ql = q.trim().toLowerCase();
    return list.filter((it) => {
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
  };

  /* keyboard for lightbox */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setActiveIndex(null);
      if (activeIndex !== null) {
        if (e.key === "ArrowLeft") {
          setActiveIndex((i) => (i > 0 ? i - 1 : currentList.length - 1));
        } else if (e.key === "ArrowRight") {
          setActiveIndex((i) => (i < currentList.length - 1 ? i + 1 : 0));
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  /* page lists */
  const available = filterList(items.filter((it) => !it.sold));
  const sold = filterList(items.filter((it) => it.sold));
  const currentList = route === "portfolio" ? sold : available;

  /* grid classes (denser + smaller text) */
  const gridClasses =
    density === "compact"
      ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3"
      : density === "cozy"
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6";

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
      {/* HEADER */}
      <Header
        route={route}
        go={go}
        q={q}
        setQ={setQ}
        tag={tag}
        setTag={setTag}
        allTags={allTags}
        density={density}
        setDensity={setDensity}
        onOwner={enterOwnerCode}
      />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {route === "gallery" && (
          <>
            <SectionTitle title="Available works" />
            <Gallery
              list={available}
              owner={owner}
              density={density}
              onOpen={setActiveIndex}
            />
          </>
        )}

        {route === "portfolio" && (
          <>
            <SectionTitle title="Portfolio (sold works)" />
            <Gallery
              list={sold}
              owner={owner}
              density={density}
              onOpen={setActiveIndex}
              showSoldRibbon={false} // page already indicates sold
            />
          </>
        )}

        {route === "detail" && (
          <>
            <SectionTitle title="Detail photos" />
            <p className="text-sm text-neutral-600 mb-4">
              Click any artwork to open a large, high-quality view. Use your
              keyboard arrows to navigate; press Esc to close.
            </p>
            <Gallery
              list={available.concat(sold)}
              owner={owner}
              density={density}
              onOpen={setActiveIndex}
            />
          </>
        )}

        {route === "bio" && (
          <section className="max-w-4xl mx-auto py-6">
            <SectionTitle title="Bio" />
            <p className="text-sm leading-relaxed text-neutral-700">
              I’m Xotten — painter and explorer of color, geometry, and rhythm.
              My work blends intuitive gestures with structured forms to create
              calm, luminous spaces. Every piece is an invitation to pause,
              breathe, and feel.
            </p>
          </section>
        )}

        {route === "guestbook" && (
          <section className="max-w-3xl mx-auto py-6">
            <SectionTitle title="Guestbook" />
            <p className="text-sm text-neutral-600 mb-4">
              Leave a note — I love reading your impressions.
            </p>
            <SimpleForm endpoint={FORMSPREE_ENDPOINT} subject="New guestbook entry">
              <TextInput name="name" label="Name" required />
              <TextInput name="email" type="email" label="Email" required />
              <TextArea name="message" label="Message" required />
            </SimpleForm>
          </section>
        )}

        {route === "blog" && (
          <section className="max-w-4xl mx-auto py-6">
            <SectionTitle title="Blog" />
            <p className="text-sm text-neutral-600">
              Blog coming soon. I’ll share works-in-progress, thoughts and
              events here.
            </p>
          </section>
        )}

        {route === "contact" && (
          <section className="max-w-3xl mx-auto py-6">
            <SectionTitle title="Contact" />
            <p className="text-sm text-neutral-600 mb-4">
              Interested in a piece or have a question? Send me a message.
            </p>
            <SimpleForm endpoint={FORMSPREE_ENDPOINT} subject="New inquiry from xotten.com">
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput name="name" label="Name" required />
                <TextInput name="email" type="email" label="Email" required />
              </div>
              <TextInput name="piece" label="Artwork (optional)" />
              <TextArea name="message" label="Message" required />
            </SimpleForm>
            <p className="text-xs text-neutral-500 mt-3">
              Prefer email?{" "}
              <a className="underline" href="mailto:xottenhobby@gmail.com">
                xottenhobby@gmail.com
              </a>
            </p>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} · All works © You.
      </footer>

      {/* LIGHTBOX */}
      {activeIndex !== null && (
        <Lightbox
          list={currentList}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onPrev={() =>
            setActiveIndex((i) => (i > 0 ? i - 1 : currentList.length - 1))
          }
          onNext={() =>
            setActiveIndex((i) => (i < currentList.length - 1 ? i + 1 : 0))
          }
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Pieces
   ───────────────────────────────────────────────────────────── */

function Header({
  route,
  go,
  q,
  setQ,
  tag,
  setTag,
  allTags,
  density,
  setDensity,
  onOwner,
}) {
  const [open, setOpen] = useState(false);
  const activeClass = "text-neutral-900 font-medium";
  const linkClass = "block px-4 py-2 rounded hover:bg-neutral-100";

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Hamburger */}
        <button
          aria-label="Menu"
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg border border-neutral-300 flex items-center justify-center hover:bg-neutral-100"
        >
          ☰
        </button>

        {/* Logo */}
        <div className="text-xl font-bold tracking-tight">Xotten Art</div>

        {/* Right controls */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            className="px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30 focus:border-[#CC5C3F]"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30 focus:border-[#CC5C3F]"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            title="Tag filter"
          >
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30 focus:border-[#CC5C3F]"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            title="Thumbnail size"
          >
            <option value="compact">Compact</option>
            <option value="cozy">Cozy</option>
            <option value="comfortable">Comfortable</option>
          </select>
          <button
            className="px-3 py-2 rounded-xl border border-transparent bg-[#CC5C3F] text-white hover:bg-[#b44f36] transition text-sm"
            onClick={onOwner}
            title="Owner login"
          >
            Owner
          </button>
        </div>
      </div>

      {/* Slide-out drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-lg border-r border-neutral-200 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
          <div className="font-semibold">Menu</div>
          <button
            aria-label="Close menu"
            className="w-8 h-8 rounded-md border border-neutral-300 hover:bg-neutral-100"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="p-3 text-sm">
          <a
            href="#gallery"
            onClick={() => setOpen(false)}
            className={`${linkClass} ${route === "gallery" ? activeClass : ""}`}
          >
            Home (Available)
          </a>
          <a
            href="#portfolio"
            onClick={() => setOpen(false)}
            className={`${linkClass} ${route === "portfolio" ? activeClass : ""}`}
          >
            Portfolio (Sold)
          </a>
          <a
            href="#detail"
            onClick={() => setOpen(false)}
            className={`${linkClass} ${route === "detail" ? activeClass : ""}`}
          >
            Detail photos
          </a>
          <a
            href="#bio"
            onClick={() => setOpen(false)}
            className={`${linkClass} ${route === "bio" ? activeClass : ""}`}
          >
            Bio
          </a>
          <a
            href="#guestbook"
            onClick={() => setOpen(false)}
            className={`${linkClass} ${route === "guestbook" ? activeClass : ""}`}
          >
            Guestbook
          </a>
          <a
            href="#blog"
            onClick={() => setOpen(false)}
            className={`${linkClass} ${route === "blog" ? activeClass : ""}`}
          >
            Blog
          </a>
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className={`${linkClass} ${route === "contact" ? activeClass : ""}`}
          >
            Contact
          </a>

          <div className="mt-4 border-t pt-3 text-neutral-500">
            <div className="text-xs mb-2">Social (coming later)</div>
            <div className="flex gap-2 text-xs">
              <span className="inline-block px-2 py-1 rounded bg-neutral-100">
                Instagram
              </span>
              <span className="inline-block px-2 py-1 rounded bg-neutral-100">
                Facebook
              </span>
            </div>
          </div>
        </nav>
      </aside>
    </header>
  );
}

function SectionTitle({ title }) {
  return <h2 className="text-base font-semibold mb-3">{title}</h2>;
}

function Gallery({ list, owner, density, onOpen, showSoldRibbon = true }) {
  return (
    <div className={density === "comfortable" ? "space-y-4" : ""}>
      <div
        className={
          density === "comfortable"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            : density === "cozy"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3"
        }
      >
        {list.map((it, idx) => (
          <Card
            key={it.id}
            item={it}
            owner={owner}
            density={density}
            onOpen={() => onOpen(idx)}
            showSoldRibbon={showSoldRibbon}
          />
        ))}
      </div>
      {list.length === 0 && (
        <div className="text-sm text-neutral-500">Nothing to show.</div>
      )}
    </div>
  );
}

/* Smaller text + consistent rounded thumbnails */
function Card({ item, owner, density, onOpen, showSoldRibbon }) {
  const pad = density === "compact" ? "p-3" : density === "cozy" ? "p-3.5" : "p-4";
  const titleSize =
    density === "compact" ? "text-[0.95rem]" : density === "cozy" ? "text-[1.02rem]" : "text-base";
  const infoSize = density === "compact" ? "text-xs" : "text-sm";

  return (
    <button
      onClick={onOpen}
      className="group relative text-left bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition cursor-zoom-in"
    >
      <div className="aspect-square bg-neutral-100 overflow-hidden rounded-xl">
        <img
          src={cldThumb(item.image, 1200)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          loading="lazy"
        />
      </div>
      <div className={pad}>
        <div className="flex items-baseline gap-2">
          <h3 className={`font-semibold leading-tight flex-1 ${titleSize}`}>
            {item.title}
          </h3>
          {item.year && (
            <span className="text-[0.8rem] text-neutral-500">{item.year}</span>
          )}
        </div>
        <div className={`mt-1 text-neutral-600 ${infoSize}`}>
          {item.media} {item.size ? <>· {item.size}</> : null}
        </div>

        {/* Price: only owner sees it */}
        {owner && item.price && (
          <div className="mt-2 text-xs font-medium">{item.price}</div>
        )}
      </div>

      {/* Optional SOLD ribbon (suppressed on the portfolio page since everything is sold) */}
      {showSoldRibbon && item.sold && (
        <div className="absolute left-0 top-4 -rotate-6 bg-[#CC5C3F] text-white px-3 py-1 text-[10px] uppercase tracking-wider rounded-r-xl shadow">
          Sold
        </div>
      )}
    </button>
  );
}

function Lightbox({ list, index, onClose, onPrev, onNext }) {
  const item = list[index];
  const src = cldThumb(item.image, 2400);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Prev */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
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
        <div className="absolute left-0 right-0 -bottom-1 mx-auto w-fit bg-white/90 text-neutral-900 text-xs px-3 py-1 rounded-t-lg shadow">
          {item.title} {item.year ? `· ${item.year}` : ""}{" "}
          {item.size ? `· ${item.size}` : ""}
        </div>
      </div>

      {/* Next */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 text-xl shadow flex items-center justify-center select-none"
      >
        ›
      </button>
    </div>
  );
}

/* Reusable minimal form (Formspree) */
function SimpleForm({ endpoint, subject, children }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(e.currentTarget),
      });
      if (res.ok) {
        setStatus("sent");
        e.currentTarget.reset();
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {status === "sent" ? (
        <div className="rounded-xl bg-green-50 text-green-800 border border-green-200 p-4 text-sm">
          Thank you! Your message was sent.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4">
          <input type="hidden" name="_subject" value={subject} />
          {children}
          <button
            type="submit"
            disabled={status === "sending"}
            className="px-4 py-2 rounded-xl bg-[#CC5C3F] text-white hover:bg-[#b44f36] transition text-sm disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send"}
          </button>
          {status === "error" && (
            <div className="text-xs text-red-600">Oops—please try again.</div>
          )}
        </form>
      )}
    </>
  );
}

function TextInput({ label, name, type = "text", required = false }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-neutral-700">{label}</span>
      <input
        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30 focus:border-[#CC5C3F]"
        name={name}
        type={type}
        required={required}
      />
    </label>
  );
}
function TextArea({ label, name, required = false }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-neutral-700">{label}</span>
      <textarea
        className="w-full min-h-[140px] px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30 focus:border-[#CC5C3F]"
        name={name}
        required={required}
      />
    </label>
  );
}

import React, { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Theme colors (your request)
   ───────────────────────────────────────────────────────────── */
const PAGE_BG = "#d9bf92";      // whole page
const DRAWER_BG = "#caa668";    // slide-out menu
const PANEL_BG = "#ead9b5";     // cards, forms, inputs (replaces white)
const BORDER_COL = "#a7844e";   // gentle border on tan
const TEXT_SHADOW = "0 1px 0 rgba(0,0,0,.9), 0 2px 2px rgba(0,0,0,.25)"; // like your example

/* ─────────────────────────────────────────────────────────────
   Config
   ───────────────────────────────────────────────────────────── */
const OWNER_CODE = "universe and me are all aligned";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mpwjwwwb";
const DENSITY_KEY = "density_v3";

/* Fallback data for local preview */
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

/* Cloudinary helper */
function cldThumb(url, width = 1600) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

/* Tiny hash router */
function useHashRoute(defaultRoute = "homepage") {
  const [route, setRoute] = useState(
    window.location.hash.replace(/^#/, "") || defaultRoute
  );
  useEffect(() => {
    const onHash = () =>
      setRoute(window.location.hash.replace(/^#/, "") || defaultRoute);
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

  /* routes */
  const [route] = useHashRoute("homepage");

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

  /* tags */
  const allTags = useMemo(() => {
    const set = new Set();
    items.forEach((it) => it.tags?.forEach((t) => set.add(t)));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  /* filtering */
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

  const available = filterList(items.filter((it) => !it.sold));
  const sold = filterList(items.filter((it) => it.sold));
  const currentList =
    route === "portfolio"
      ? sold
      : route === "detail"
      ? available.concat(sold)
      : available; // homepage

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
  }, [activeIndex, currentList]);

  /* grid classes */
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
    <div className="min-h-screen text-neutral-900" style={{ backgroundColor: PAGE_BG }}>
      <Header
        route={route}
        q={q}
        setQ={setQ}
        tag={tag}
        setTag={setTag}
        allTags={allTags}
        density={density}
        setDensity={setDensity}
        onOwner={enterOwnerCode}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {route === "homepage" && (
          <>
            <SectionTitle title="Homepage" />
            <div className={gridClasses}>
              {available.map((it, idx) => (
                <Card
                  key={it.id}
                  item={it}
                  owner={owner}
                  density={density}
                  onOpen={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          </>
        )}

        {route === "portfolio" && (
          <>
            <SectionTitle title="Portfolio" />
            <div className={gridClasses}>
              {sold.map((it, idx) => (
                <Card
                  key={it.id}
                  item={it}
                  owner={owner}
                  density={density}
                  onOpen={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          </>
        )}

        {route === "detail" && (
          <>
            <SectionTitle title="Detail photos" />
            <p className="text-sm text-neutral-900 mb-4">
              Click any artwork to open a large, high-quality view. Use your
              keyboard arrows to navigate; press Esc to close.
            </p>
            <div className={gridClasses}>
              {currentList.map((it, idx) => (
                <Card
                  key={it.id}
                  item={it}
                  owner={owner}
                  density={density}
                  onOpen={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          </>
        )}

        {route === "bio" && (
          <section className="max-w-4xl mx-auto py-6">
            <SectionTitle title="Bio" />
            <p className="text-sm leading-relaxed text-neutral-900">
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
            <p className="text-sm text-neutral-900 mb-4">
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
            <p className="text-sm text-neutral-900">
              Blog coming soon. I’ll share works-in-progress, thoughts and
              events here.
            </p>
          </section>
        )}

        {route === "contact" && (
          <section className="max-w-3xl mx-auto py-6">
            <SectionTitle title="Contact" />
            <p className="text-sm text-neutral-900 mb-4">
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
            <p className="text-xs text-neutral-900 mt-3">
              Prefer email?{" "}
              <a className="underline" href="mailto:xottenhobby@gmail.com">
                xottenhobby@gmail.com
              </a>
            </p>
          </section>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-neutral-900">
        © {new Date().getFullYear()} · All works © You.
      </footer>

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

      <BackToTop />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Pieces
   ───────────────────────────────────────────────────────────── */

function Header({
  route,
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
  const activeClass = "text-neutral-900 font-semibold";
  const linkBase = "block px-4 py-2 rounded";

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{ backgroundColor: PAGE_BG, borderColor: BORDER_COL }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Hamburger */}
        <button
          aria-label="Menu"
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg border flex items-center justify-center"
          style={{ borderColor: BORDER_COL, backgroundColor: PANEL_BG }}
          title="Open menu"
        >
          ☰
        </button>

        {/* Logo with stronger shadow */}
        <div
          className="text-xl font-bold tracking-tight"
          style={{ textShadow: TEXT_SHADOW }}
        >
          Xotten Art
        </div>

        {/* Right controls */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30"
            style={{ backgroundColor: PANEL_BG, borderColor: BORDER_COL }}
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30"
            style={{ backgroundColor: PANEL_BG, borderColor: BORDER_COL }}
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
            className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30"
            style={{ backgroundColor: PANEL_BG, borderColor: BORDER_COL }}
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            title="Thumbnail size"
          >
            <option value="compact">Compact</option>
            <option value="cozy">Cozy</option>
            <option value="comfortable">Comfortable</option>
          </select>
          <button
            className="px-3 py-2 rounded-xl border text-sm text-white hover:opacity-95 transition"
            style={{ backgroundColor: "#CC5C3F", borderColor: "transparent" }}
            onClick={onOwner}
            title="Owner login"
          >
            Owner
          </button>
        </div>
      </div>

      {/* Dark overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/70 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      {/* Solid drawer in darker tan */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-[80] text-neutral-900 shadow-2xl border-r transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: DRAWER_BG, borderColor: BORDER_COL }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: BORDER_COL }}
        >
          <div className="font-semibold" style={{ textShadow: TEXT_SHADOW }}>
            Menu
          </div>
          <button
            aria-label="Close menu"
            className="w-8 h-8 rounded-md border"
            style={{ borderColor: BORDER_COL, backgroundColor: PANEL_BG }}
            onClick={() => setOpen(false)}
            title="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="p-3 text-sm space-y-1">
          <a
            href="#homepage"
            onClick={() => setOpen(false)}
            className={`${linkBase} ${
              route === "homepage" ? activeClass : ""
            }`}
            style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
          >
            Homepage
          </a>
          <a
            href="#portfolio"
            onClick={() => setOpen(false)}
            className={`${linkBase} ${route === "portfolio" ? activeClass : ""}`}
            style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
          >
            Portfolio
          </a>
          <a
            href="#detail"
            onClick={() => setOpen(false)}
            className={`${linkBase} ${route === "detail" ? activeClass : ""}`}
            style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
          >
            Detail photos
          </a>
          <a
            href="#bio"
            onClick={() => setOpen(false)}
            className={`${linkBase} ${route === "bio" ? activeClass : ""}`}
            style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
          >
            Bio
          </a>
          <a
            href="#guestbook"
            onClick={() => setOpen(false)}
            className={`${linkBase} ${route === "guestbook" ? activeClass : ""}`}
            style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
          >
            Guestbook
          </a>
          <a
            href="#blog"
            onClick={() => setOpen(false)}
            className={`${linkBase} ${route === "blog" ? activeClass : ""}`}
            style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
          >
            Blog
          </a>
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className={`${linkBase} ${route === "contact" ? activeClass : ""}`}
            style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
          >
            Contact
          </a>
        </nav>
      </aside>
    </header>
  );
}

function SectionTitle({ title }) {
  return (
    <h2
      className="text-base font-semibold mb-3"
      style={{ textShadow: TEXT_SHADOW }}
    >
      {title}
    </h2>
  );
}

/* Consistent rounded thumbnails + smaller text, owner-only price
   Panels and cards use PANEL_BG instead of white */
function Card({ item, owner, density, onOpen }) {
  const pad =
    density === "compact" ? "p-3" : density === "cozy" ? "p-3.5" : "p-4";
  const titleSize =
    density === "compact"
      ? "text-[0.95rem]"
      : density === "cozy"
      ? "text-[1.02rem]"
      : "text-base";
  const infoSize = density === "compact" ? "text-xs" : "text-sm";

  return (
    <button
      onClick={onOpen}
      className="group relative text-left rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition cursor-zoom-in border"
      style={{ backgroundColor: PANEL_BG, borderColor: BORDER_COL }}
    >
      <div className="aspect-square overflow-hidden rounded-xl" style={{ backgroundColor: "#f3f3f3" }}>
        <img
          src={cldThumb(item.image, 1200)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={pad}>
        <div className="flex items-baseline gap-2">
          <h3 className={`font-semibold leading-tight flex-1 ${titleSize}`}>
            {item.title}
          </h3>
          {item.year && (
            <span className="text-[0.8rem] text-neutral-800">{item.year}</span>
          )}
        </div>
        <div className={`mt-1 text-neutral-900 ${infoSize}`}>
          {item.media} {item.size ? <>· {item.size}</> : null}
        </div>
        {/* Price: only owner sees it */}
        {owner && item.price && (
          <div className="mt-2 text-xs font-medium text-neutral-900">
            {item.price}
          </div>
        )}
      </div>
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

/* Floating Back-to-top button (uses panel color) */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-50 rounded-full shadow-lg px-3 py-2 text-sm"
      style={{ backgroundColor: PANEL_BG, border: `1px solid ${BORDER_COL}` }}
      title="Back to top"
    >
      ↑ Top
    </button>
  );
}

/* Reusable minimal form (Formspree) — panel background */
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
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            backgroundColor: "#e4f5e8",
            border: "1px solid #b7e0c4",
            color: "#0f5132",
          }}
        >
          Thank you! Your message was sent.
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl shadow-sm p-5 space-y-4 border"
          style={{ backgroundColor: PANEL_BG, borderColor: BORDER_COL }}
        >
          <input type="hidden" name="_subject" value={subject} />
          {children}
          <button
            type="submit"
            disabled={status === "sending"}
            className="px-4 py-2 rounded-xl text-sm text-white disabled:opacity-60"
            style={{ backgroundColor: "#CC5C3F" }}
          >
            {status === "sending" ? "Sending…" : "Send"}
          </button>
          {status === "error" && (
            <div className="text-xs" style={{ color: "#b42318" }}>
              Oops—please try again.
            </div>
          )}
        </form>
      )}
    </>
  );
}

function TextInput({ label, name, type = "text", required = false }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-neutral-900">{label}</span>
      <input
        className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30"
        style={{ backgroundColor: PANEL_BG, borderColor: BORDER_COL }}
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
      <span className="block mb-1 text-neutral-900">{label}</span>
      <textarea
        className="w-full min-h-[140px] px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring focus:ring-[#CC5C3F]/30"
        style={{ backgroundColor: PANEL_BG, borderColor: BORDER_COL }}
        name={name}
        required={required}
      />
    </label>
  );
}

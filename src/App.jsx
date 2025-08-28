import React, { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Config
   ───────────────────────────────────────────────────────────── */
const OWNER_CODE = "universe and me are all aligned"; // owner view unlock
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mpwjwwwb"; // contact form

// Fallback (so local preview works even without art.json)
const FALLBACK_DATA = [
  {
    id: "art-001",
    title: "The Celestial Discovery",
    year: 2025,
    media: "Oil on canvas",
    size: "80×60 cm",
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
    sold: true,
    image: "/art/sample2.jpg",
    tags: ["nature", "green"],
  },
];

/** Add Cloudinary transforms if URL is Cloudinary */
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
  const [section, setSection] = useState(() => {
    const h = window.location.hash.toLowerCase();
    if (h.includes("portfolio")) return "portfolio";
    if (h.includes("about")) return "about";
    if (h.includes("contact")) return "contact";
    return "home";
  });

  // Owner unlock via ?owner=...
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

  // Load artworks
  useEffect(() => {
    fetch("/art.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : FALLBACK_DATA))
      .then((data) => setItems(Array.isArray(data) ? data : FALLBACK_DATA))
      .catch(() => setItems(FALLBACK_DATA));
  }, []);

  // Build tags for filter
  const allTags = useMemo(() => {
    const set = new Set();
    items.forEach((it) => it.tags?.forEach((t) => set.add(t)));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  // Filtered list based on section + search + tag
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items
      .filter((it) =>
        section === "portfolio" ? it.sold === true : it.sold !== true
      )
      .filter((it) => {
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
  }, [items, q, tag, section]);

  // Keyboard for lightbox
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

  // Update hash when section changes
  useEffect(() => {
    window.location.hash = section === "home" ? "" : `#${section}`;
  }, [section]);

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
    <div
      className="min-h-screen text-neutral-900"
      style={{
        // Page background: warm tan; optional bg image if /bg.jpg exists
        backgroundColor: "#d9bf92",
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 backdrop-blur bg-[#d9bf92e6] border-b border-[#caa668]/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div
            className="text-xl sm:text-2xl font-bold tracking-tight select-none"
            style={{
              color: "#2b2b2b",
              filter:
                "drop-shadow(0 1px 0 rgba(0,0,0,0.30)) drop-shadow(0 2px 0 rgba(0,0,0,0.20))",
            }}
          >
            Xotten Art
          </div>

          <nav className="mx-auto hidden sm:flex items-center gap-6 text-[15px]">
            <NavLink
              current={section === "home"}
              onClick={() => setSection("home")}
            >
              Home
            </NavLink>
            <NavLink
              current={section === "portfolio"}
              onClick={() => setSection("portfolio")}
            >
              Portfolio
            </NavLink>
            <NavLink
              current={section === "about"}
              onClick={() => setSection("about")}
            >
              About
            </NavLink>
            <NavLink
              current={section === "contact"}
              onClick={() => setSection("contact")}
            >
              Contact
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {(section === "home" || section === "portfolio") && (
              <>
                <input
                  className="px-3 py-2 rounded-xl border bg-[#e7d8b9] border-[#caa668]/60 focus:outline-none focus:ring focus:ring-black/10"
                  placeholder="Search…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  className="px-3 py-2 rounded-xl border bg-[#e7d8b9] border-[#caa668]/60"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  title="Filter by tag"
                >
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button
              className="px-3 py-2 rounded-xl bg-[#caa668] text-white/95 hover:brightness-95"
              title="Owner login"
              onClick={enterOwnerCode}
            >
              Owner
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {section === "about" && <About />}
        {section === "contact" && <ContactForm />}
        {(section === "home" || section === "portfolio") && (
          <>
            <h2
              className="text-center text-xl sm:text-2xl font-semibold mb-6 select-none"
              style={{
                filter:
                  "drop-shadow(0 1px 0 rgba(0,0,0,0.35)) drop-shadow(0 2px 0 rgba(0,0,0,0.18))",
                color: "#4b3a21",
              }}
            >
              {section === "home" ? "Available Works" : "Portfolio"}
            </h2>

            {/* NOTE: pure image tiles (no card boxes), equal height row feel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filtered.map((it, idx) => (
                <Tile
                  key={it.id}
                  item={it}
                  owner={owner}
                  onOpen={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-10 text-center text-[13px] text-neutral-800/80">
        © {new Date().getFullYear()} · All works © You.
      </footer>

      {/* LIGHTBOX */}
      {activeIndex !== null && (
        <Lightbox
          item={filtered[activeIndex]}
          onClose={() => setActiveIndex(null)}
          onPrev={() =>
            setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1))
          }
          onNext={() =>
            setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0))
          }
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   UI bits
   ───────────────────────────────────────────────────────────── */

function NavLink({ current, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-2 pb-1 transition ${
        current ? "text-[#4b3a21]" : "text-neutral-800/80 hover:text-[#4b3a21]"
      }`}
      style={{
        filter:
          "drop-shadow(0 1px 0 rgba(0,0,0,0.25)) drop-shadow(0 2px 0 rgba(0,0,0,0.15))",
      }}
    >
      {children}
      {current && (
        <span className="absolute -bottom-1 left-0 right-0 mx-auto h-[2px] w-7 bg-[#caa668] rounded-full" />
      )}
    </button>
  );
}

/** Pure image tile (no panel). Same visual height for a clean row look. */
function Tile({ item, owner, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group relative block cursor-zoom-in"
      title={item.title}
    >
      <div className="w-full h-[300px] sm:h-[320px] md:h-[340px] lg:h-[360px]">
        <img
          src={cldThumb(item.image, 1600)}
          alt={item.title}
          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>

      {/* Hover caption */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition">
        <div className="mx-auto w-fit rounded-full px-3 py-1 text-[12px] text-[#3a2d18] bg-[#e9dbbd]/90 border border-[#caa668]/40">
          {item.title} {item.year ? `· ${item.year}` : ""}{" "}
          {item.size ? `· ${item.size}` : ""}
        </div>
      </div>

      {/* Owner-only sold ribbon (public won’t see this label) */}
      {owner && item.sold && (
        <div className="absolute left-0 top-3 -rotate-6 bg-[#caa668] text-white px-3 py-1 text-xs uppercase tracking-wider rounded-r-xl shadow">
          Sold
        </div>
      )}
    </button>
  );
}

function About() {
  return (
    <section className="max-w-4xl mx-auto">
      <div className="rounded-2xl border border-[#caa668]/40 bg-[#e7d8b9]/70 p-6">
        <h2
          className="text-xl sm:text-2xl font-semibold mb-3"
          style={{
            color: "#4b3a21",
            filter:
              "drop-shadow(0 1px 0 rgba(0,0,0,0.35)) drop-shadow(0 2px 0 rgba(0,0,0,0.18))",
          }}
        >
          About
        </h2>
        <p className="leading-relaxed text-[15px] text-neutral-900/90">
          I’m Xotten — painter and explorer of color, geometry, and rhythm. My
          work blends intuitive gestures with structured forms to create calm,
          luminous spaces. Every piece is an invitation to pause, breathe, and
          feel.
        </p>
      </div>
    </section>
  );
}

function ContactForm() {
  const [state, setState] = useState({
    name: "",
    email: "",
    piece: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(e.currentTarget),
      });
      if (res.ok) {
        setStatus("sent");
        setState({ name: "", email: "", piece: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-[#caa668]/40 bg-[#e7d8b9]/70 p-6">
        <h2
          className="text-xl sm:text-2xl font-semibold mb-4"
          style={{
            color: "#4b3a21",
            filter:
              "drop-shadow(0 1px 0 rgba(0,0,0,0.35)) drop-shadow(0 2px 0 rgba(0,0,0,0.18))",
          }}
        >
          Contact
        </h2>

        {status === "sent" ? (
          <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 p-4">
            Thank you! Your message was sent. I’ll get back to you soon.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 text-[15px]">
            <input type="hidden" name="_subject" value="New inquiry from xotten.com" />
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                name="name"
                required
                placeholder="Your name"
                className="px-3 py-2 rounded-xl border border-[#caa668]/50 bg-[#f2e7ca]"
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                type="email"
                name="email"
                required
                placeholder="Your email"
                className="px-3 py-2 rounded-xl border border-[#caa668]/50 bg-[#f2e7ca]"
                value={state.email}
                onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <input
              name="piece"
              placeholder="Artwork (optional)"
              className="px-3 py-2 rounded-xl border border-[#caa668]/50 bg-[#f2e7ca]"
              value={state.piece}
              onChange={(e) => setState((s) => ({ ...s, piece: e.target.value }))}
            />
            <textarea
              name="message"
              required
              placeholder="Your message"
              className="px-3 py-2 rounded-xl border border-[#caa668]/50 bg-[#f2e7ca] min-h-[130px]"
              value={state.message}
              onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="px-4 py-2 rounded-xl bg-[#caa668] text-white hover:brightness-95 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
            <p className="text-sm text-neutral-700">
              Prefer email?{" "}
              <a className="underline" href="mailto:xottenhobby@gmail.com">
                xottenhobby@gmail.com
              </a>
            </p>
          </form>
        )}

        {status === "error" && (
          <div className="mt-4 rounded-xl bg-red-50 text-red-800 border border-red-200 p-3">
            Oops—something went wrong. Please try again or email me directly.
          </div>
        )}
      </div>
    </section>
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
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 bg-white text-neutral-800 rounded-full shadow p-2 hover:scale-105 transition"
          title="Close (Esc)"
        >
          ✕
        </button>
        <div className="absolute left-0 right-0 -bottom-1 mx-auto w-fit bg-white/90 text-neutral-900 text-sm px-3 py-1 rounded-t-lg shadow">
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

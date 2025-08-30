// src/App.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";

/*
  xotten.com — side menu (3-line handle), uniform square thumbnails, page titles
  - Side menu handle: 3 lines, slightly lower + a bit to the right
  - Home & Portfolio: centered page titles above the gallery
  - All thumbnails are same width & height (square), cropped via object-fit: cover
  - Caption pill below image on hover (unchanged)
  - Routes: #/, #/portfolio, #/about, #/contact, #/codex
  - Preserves ?owner=universe
*/

/* ----------------- UTIL ----------------- */
function getOwnerMode() {
  if (typeof window === "undefined") return false;
  try { return new URLSearchParams(window.location.search).get("owner") === "universe"; }
  catch (_) { return false; }
}
function ensureHash() {
  if (typeof window === "undefined") return;
  if (!window.location.hash) window.location.hash = "/";
}
function useHashRoute() {
  const compute = function () {
    if (typeof window === "undefined") return "home";
    var raw = window.location.hash || "#/";
    var path = raw.replace(/^#/, "");
    if (path === "/" || path === "") return "home";
    if (path === "/portfolio") return "portfolio";
    if (path === "/about") return "about";
    if (path === "/contact") return "contact";
    if (path === "/codex") return "codex";
    return "home";
  };
  const [route, setRoute] = useState(compute());
  useEffect(function () {
    ensureHash();
    const onHash = function () { setRoute(compute()); };
    window.addEventListener("hashchange", onHash);
    return function cleanup() { window.removeEventListener("hashchange", onHash); };
  }, []);
  return route;
}
function useArtData() {
  const [art, setArt] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  useEffect(function () {
    var alive = true;
    (async function run() {
      try {
        const res = await fetch("/art.json", { cache: "no-cache" });
        if (!res.ok) throw new Error("Failed to load art.json (" + res.status + ")");
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data && data.items) ? data.items : [];
        if (alive) setArt(list);
      } catch (e) {
        if (alive) setErr(e && e.message ? e.message : "Error loading artworks");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return function cleanup() { alive = false; };
  }, []);
  return { art, loading, err };
}
function useLocalStorageState(key, initialValue) {
  const read = function () {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return typeof initialValue === "function" ? initialValue() : initialValue;
  };
  const [state, setState] = useState(read);
  useEffect(function () {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {}
  }, [key, state]);
  return [state, setState];
}

/* ----------------- CHROME ----------------- */
function Chrome({ children }) {
  const ownerMode = getOwnerMode();
  const route = useHashRoute();
  return (
    <div className="app-shell">
      <SideMenu ownerMode={ownerMode} route={route} />
      {ownerMode ? <div className="owner-badge" title="Owner mode (hidden from public)">owner</div> : null}
      <main className="container content">{children}</main>
      <footer className="site-footer" role="contentinfo">
        <small>&copy; {new Date().getFullYear()} xotten</small>
      </footer>
      <GlobalStyles />
    </div>
  );
}

function SideMenu({ ownerMode, route }) {
  const [open, setOpen] = useState(false);
  const base = (typeof window !== "undefined" ? window.location.pathname : "/") || "/";
  const search = ownerMode ? "?owner=universe" : "";
  const href = function (hashPath) { return base + search + "#" + hashPath; };
  const linkClass = function (name) { return "side-link" + (route === name ? " is-active" : ""); };

  useEffect(function () {
    const onKey = function (e) { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return function cleanup() { document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <>
      {!open ? (
        <button
          className="menu-handle"
          aria-label="Open menu"
          aria-expanded="false"
          onClick={function () { setOpen(true); }}
        >
          <span className="line" />
          <span className="line" />
          <span className="line" />
        </button>
      ) : null}

      {open ? <div className="menu-backdrop" onClick={function () { setOpen(false); }} /> : null}

      <aside className={"sidemenu" + (open ? " is-open" : "")} aria-label="Site menu">
        <div className="side-top">
          <div className="brand">xotten</div>
          <button className="menu-close" aria-label="Close menu" onClick={function () { setOpen(false); }}>×</button>
        </div>

        <nav className="side-nav">
          <a href={href("/")} className={linkClass("home")} onClick={function () { setOpen(false); }}>Home</a>
          <a href={href("/portfolio")} className={linkClass("portfolio")} onClick={function () { setOpen(false); }}>Portfolio</a>
          <a href={href("/about")} className={linkClass("about")} onClick={function () { setOpen(false); }}>About</a>
          <a href={href("/contact")} className={linkClass("contact")} onClick={function () { setOpen(false); }}>Contact</a>
          <a href={href("/codex")} className={linkClass("codex")} onClick={function () { setOpen(false); }}>Codex</a>
        </nav>

        <div className="side-foot">
          <span className="foot-note">© {new Date().getFullYear()}</span>
        </div>
      </aside>
    </>
  );
}

/* ----------------- GALLERY ----------------- */
function colorFromTags(tags) {
  if (!Array.isArray(tags)) return "rgba(232, 222, 199, 0.95)";
  var lower = tags.map(function (t) { return String(t || "").toLowerCase(); });
  if (lower.indexOf("green") >= 0 || lower.indexOf("nature") >= 0) return "rgba(70,140,95,0.92)";
  return "rgba(232, 222, 199, 0.95)";
}
function Gallery({ items }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const openAt = useCallback(function (idx) { setLightboxIndex(idx); }, []);
  const close = useCallback(function () { setLightboxIndex(null); }, []);
  const prev = useCallback(function () {
    setLightboxIndex(function (i) { return i == null ? null : (i + items.length - 1) % items.length; });
  }, [items.length]);
  const next = useCallback(function () {
    setLightboxIndex(function (i) { return i == null ? null : (i + 1) % items.length; });
  }, [items.length]);

  return (
    <>
      <section className="grid" aria-live="polite">
        {items.map(function (art, idx) {
          const key = art && art.image ? art.image : (art && art.title ? art.title + "-" + idx : "art-" + idx);
          const bg = colorFromTags(art && art.tags ? art.tags : []);
          const line = (art && art.size) ? ((art.title || "") + " \u00B7 " + art.size) : (art && art.title ? art.title : "");
          return (
            <figure key={key} className="thumb">
              <button
                className="thumb-button"
                onClick={function () { openAt(idx); }}
                aria-label={"Open \"" + ((art && art.title) || "Artwork") + "\" larger"}
              >
                <img
                  loading="lazy"
                  src={art && art.image ? art.image : ""}
                  alt={(art && art.title) || "Artwork"}
                  className="thumb-img"
                />
              </button>
              <figcaption className="caption-pill" style={{ background: bg }}>
                <span className="caption-text">{line}</span>
              </figcaption>
            </figure>
          );
        })}
      </section>

      {lightboxIndex != null ? (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      ) : null}
    </>
  );
}

/* ----------------- LIGHTBOX ----------------- */
function Lightbox({ items, index, onClose, onPrev, onNext }) {
  useEffect(function () {
    const onKey = function (e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    return function cleanup() { document.removeEventListener("keydown", onKey); };
  }, [onClose, onPrev, onNext]);

  useEffect(function () {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return function cleanup() { document.body.style.overflow = original; };
  }, []);

  useEffect(function () {
    if (!items || !items.length) return;
    const prevImg = new Image();
    const nextImg = new Image();
    var i1 = (index + items.length - 1) % items.length;
    var i2 = (index + 1) % items.length;
    prevImg.src = items[i1] && items[i1].image ? items[i1].image : "";
    nextImg.src = items[i2] && items[i2].image ? items[i2].image : "";
  }, [index, items]);

  const item = items[index] || null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={(item && item.title) ? item.title : "Artwork"} onClick={onClose}>
      <div className="lightbox-inner" onClick={function (e) { e.stopPropagation(); }}>
        <img src={(item && item.image) ? item.image : ""} alt={(item && item.title) ? item.title : "Artwork"} className="lightbox-img" />
        <div className="lightbox-meta">
          <div className="lightbox-title">{item && item.title ? item.title : null}</div>
          {item && item.size ? <div className="lightbox-size">{item.size}</div> : null}
        </div>
        <button className="lb-btn lb-close" onClick={onClose} aria-label="Close">×</button>
        <button className="lb-btn lb-prev" onClick={onPrev} aria-label="Previous (ArrowLeft)">‹</button>
        <button className="lb-btn lb-next" onClick={onNext} aria-label="Next (ArrowRight)">›</button>
      </div>
    </div>
  );
}

/* ----------------- PAGES ----------------- */
function Home() {
  const { art, loading, err } = useArtData();
  const items = useMemo(function () { return art.filter(function (a) { return !a.sold; }); }, [art]);
  return (
    <Chrome>
      <section className="page-head"><h1 className="page-title">Home</h1></section>
      {loading ? <div className="status">Loading…</div> : null}
      {err ? <div className="status" role="alert">{err}</div> : null}
      {!loading && !err ? <Gallery items={items} /> : null}
    </Chrome>
  );
}
function Portfolio() {
  const { art, loading, err } = useArtData();
  const items = useMemo(function () { return art.filter(function (a) { return !!a.sold; }); }, [art]);
  return (
    <Chrome>
      <section className="page-head"><h1 className="page-title">Portfolio</h1></section>
      {loading ? <div className="status">Loading…</div> : null}
      {err ? <div className="status" role="alert">{err}</div> : null}
      {!loading && !err ? <Gallery items={items} /> : null}
    </Chrome>
  );
}
function About() {
  return (
    <Chrome>
      <section className="text-page">
        <h1>About</h1>
        <p>Painterly experiments in color, texture, and atmosphere. For inquiries, see Contact.</p>
      </section>
    </Chrome>
  );
}
function Contact() {
  return (
    <Chrome>
      <section className="text-page">
        <h1>Contact</h1>
        <p>For commissions, acquisitions, or studio visits, please email <a href="mailto:hello@xotten.com">hello@xotten.com</a>.</p>
      </section>
    </Chrome>
  );
}

/* ---- Codex (Chat) ---- */
function Codex() {
  const ownerMode = getOwnerMode();
  const [messages, setMessages] = useLocalStorageState("xotten_codex_chat", function () {
    return [
      { id: Date.now(), role: "studio", text: "Welcome to Codex. Share your thoughts here.", at: Date.now() }
    ];
  });
  const [input, setInput] = useState("");
  const [ownerInput, setOwnerInput] = useState("");

  const sendUser = function () {
    var text = input.trim();
    if (!text) return;
    setMessages(function (prev) { return prev.concat([{ id: Date.now(), role: "user", text: text, at: Date.now() }]); });
    setInput("");
  };
  const sendOwner = function () {
    var text = ownerInput.trim();
    if (!text) return;
    setMessages(function (prev) { return prev.concat([{ id: Date.now(), role: "studio", text: text, at: Date.now() }]); });
    setOwnerInput("");
  };

  return (
    <Chrome>
      <section className="codex">
        <h1 className="codex-title">Codex</h1>
        <div className="chat">
          <div className="chat-scroll" id="chat-scroll">
            {messages.map(function (m) {
              const key = String(m.id) + "-" + String(m.at);
              const cls = "bubble " + (m.role === "user" ? "from-user" : "from-studio");
              return (
                <div key={key} className={cls}>
                  <p className="bubble-text">{m.text}</p>
                </div>
              );
            })}
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={function (e) { setInput(e.target.value); }}
              onKeyDown={function (e) { if (e.key === "Enter") sendUser(); }}
              placeholder="Write a message…"
              aria-label="Type your message"
            />
            <button onClick={sendUser} aria-label="Send">Send</button>
          </div>

          {ownerMode ? (
            <div className="chat-owner">
              <div className="owner-label">Owner reply</div>
              <div className="owner-row">
                <input
                  value={ownerInput}
                  onChange={function (e) { setOwnerInput(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") sendOwner(); }}
                  placeholder="Reply as studio…"
                  aria-label="Owner reply"
                />
                <button onClick={sendOwner} aria-label="Send owner reply">Reply</button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </Chrome>
  );
}

/* ----------------- APP ----------------- */
export default function App() {
  ensureHash();
  const route = useHashRoute();
  return (
    <>
      {route === "home" ? <Home /> : null}
      {route === "portfolio" ? <Portfolio /> : null}
      {route === "about" ? <About /> : null}
      {route === "contact" ? <Contact /> : null}
      {route === "codex" ? <Codex /> : null}
    </>
  );
}

/* ----------------- GLOBAL STYLES ----------------- */
function GlobalStyles() {
  const CSS = [
    ':root{--fg:rgba(255,255,255,0.92);--fg-dim:rgba(255,255,255,0.75);--fg-faint:rgba(255,255,255,0.6);--ink:#1f1f1f;--shadow:0 10px 30px rgba(0,0,0,0.25);--gap:clamp(10px,2.2vw,18px);--base:clamp(13px,1.4vw,15px);--title:clamp(16px,1.8vw,18px);--h1:clamp(26px,3.2vw,34px);--menu-bg:rgb(231,216,185);--handle-lines:rgb(84,55,51);--studio:#f1e7c9;--user:#e3f2ff;}',
    '*{box-sizing:border-box}',
    'html,body,#root{height:100%}',
    'html,body{margin:0;color:var(--fg);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Inter,"Helvetica Neue",Arial,"Noto Sans","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";font-size:var(--base);line-height:1.45;letter-spacing:.01em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;background:#000 url("/bg.jpg") center/cover fixed no-repeat}',
    'a{color:inherit;text-decoration:none}',
    '.app-shell{min-height:100%;display:flex;flex-direction:column}',

    /* HANDLE: 3 lines, slightly lower & right */
    '.menu-handle{position:fixed;left:18px;top:72px;z-index:80;width:48px;height:48px;border:none;background:transparent;padding:0;display:grid;place-items:center;cursor:pointer}',
    '.menu-handle .line{display:block;width:30px;height:3px;background:var(--handle-lines);margin:3px 0;border-radius:2px}',

    /* Backdrop */
    '.menu-backdrop{position:fixed;inset:0;z-index:59;background:transparent}',

    /* Sliding menu */
    '.sidemenu{position:fixed;inset:0 auto 0 0;width:clamp(220px,22vw,300px);background:var(--menu-bg);color:#111;display:flex;flex-direction:column;justify-content:space-between;padding:18px 16px;border-right:1px solid rgba(0,0,0,0.06);box-shadow:4px 0 30px rgba(0,0,0,0.25);z-index:60;transform:translateX(-100%);transition:transform .28s ease}',
    '.sidemenu.is-open{transform:translateX(0)}',
    '.side-top{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.brand{font-weight:800;font-size:18px;letter-spacing:.06em;text-transform:lowercase}',
    '.menu-close{border:1px solid rgba(0,0,0,0.12);background:rgba(0,0,0,0.06);color:#111;width:34px;height:34px;border-radius:999px;cursor:pointer;font-size:20px;line-height:1}',

    '.side-nav{margin-top:10px;display:flex;flex-direction:column;gap:6px}',
    '.side-link{padding:10px 12px;border-radius:12px;color:#111;opacity:.95;border:1px solid rgba(0,0,0,0.06);background:transparent}',
    '.side-link:hover{background:rgba(0,0,0,0.06)}',
    '.side-link.is-active{background:rgba(255,255,255,0.5);outline:2px solid rgba(0,0,0,0.08)}',
    '.side-foot{opacity:.8;font-size:12px}',
    '.foot-note{color:#111}',

    /* CONTENT AREA */
    '.container.content{width:min(1400px,95vw);margin:28px auto 60px;padding-left:24px;padding-right:24px}',

    /* OWNER BADGE */
    '.owner-badge{position:fixed;right:10px;bottom:10px;z-index:65;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#111;background:rgba(255,215,0,.6);padding:6px 8px;border-radius:999px;box-shadow:var(--shadow);user-select:none}',

    /* PAGE TITLES (centered above gallery) */
    '.page-head{text-align:center;margin:4px 0 18px}',
    '.page-title{font-size:var(--h1);margin:0;letter-spacing:.01em;color:var(--fg)}',

    /* GRID & THUMBS — square tiles */
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--gap)}',
    '.thumb{margin:0;position:relative;overflow:visible;text-align:center}',
    '.thumb-button{padding:0;margin:0;border:0;background:transparent;width:100%;display:block;cursor:zoom-in;text-align:left;border-radius:0;overflow:hidden}',
    '.thumb-img{width:100%;aspect-ratio:1/1;height:auto;display:block;background:#000;border-radius:0;object-fit:cover}',
    '.caption-pill{display:inline-block;max-width:100%;margin:10px auto 4px;padding:8px 14px;border-radius:999px;background:rgba(232,222,199,0.95);color:#1f1f1f;box-shadow:0 6px 18px rgba(0,0,0,.18);opacity:0;transform:translateY(6px);transition:opacity .25s ease,transform .25s ease;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.caption-text{font-size:clamp(12px,1.3vw,14px);letter-spacing:.01em;line-height:1.25;font-weight:600}',
    '.thumb:hover .caption-pill,.thumb-button:focus-visible + .caption-pill{opacity:1;transform:translateY(0)}',

    /* LIGHTBOX */
    '.lightbox{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.85);display:grid;place-items:center;padding:20px;cursor:zoom-out}',
    '.lightbox-inner{position:relative;max-width:min(92vw,1400px);max-height:86vh;width:100%;cursor:auto}',
    '.lightbox-img{width:100%;max-height:86vh;object-fit:contain;display:block;border-radius:12px;box-shadow:var(--shadow);background:#000}',
    '.lightbox-meta{position:absolute;left:12px;bottom:12px;right:12px;display:flex;align-items:baseline;gap:12px;padding:8px 12px;border-radius:10px;background:linear-gradient(to top,rgba(0,0,0,.30),rgba(0,0,0,.05));color:var(--fg)}',
    '.lightbox-title{font-size:clamp(14px,1.6vw,18px);font-weight:600;letter-spacing:.015em}',
    '.lightbox-size{opacity:.9;font-size:clamp(12px,1.3vw,14px)}',
    '.lb-btn{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.35);color:#fff;display:grid;place-items:center;box-shadow:var(--shadow);cursor:pointer;transition:transform .15s ease,background .15s ease;user-select:none}',
    '.lb-btn:hover{transform:translateY(-50%) scale(1.06);background:rgba(0,0,0,.5)}',
    '.lb-prev{left:8px}',
    '.lb-next{right:8px}',
    '.lb-close{top:8px;right:8px;transform:none;width:36px;height:36px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.55)}',
    '.lb-close:hover{transform:scale(1.06)}',

    /* TEXT PAGES & FOOTER */
    '.text-page{width:min(800px,92vw);margin:6vh auto 10vh;padding:18px 0;color:var(--fg)}',
    '.text-page h1{font-size:var(--h1);margin:0 0 12px;letter-spacing:.01em}',
    '.text-page p{margin:0 0 10px;color:var(--fg-dim)}',
    '.site-footer{margin:28px auto 30px;text-align:center;color:var(--fg-faint)}',
    '.status{text-align:center;padding:40px 0;color:var(--fg-dim)}',

    /* Codex chat */
    '.codex{width:min(900px,92vw);margin:2vh auto 10vh;color:var(--fg)}',
    '.codex-title{font-size:var(--h1);margin:0 0 14px;letter-spacing:.01em}',
    '.chat{background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px}',
    '.chat-scroll{max-height:60vh;overflow:auto;padding:6px 2px;display:flex;flex-direction:column;gap:8px}',
    '.bubble{max-width:80%;padding:10px 12px;border-radius:14px;line-height:1.35;font-size:clamp(12px,1.2vw,14px);box-shadow:0 4px 12px rgba(0,0,0,.18)}',
    '.from-studio{background:#f1e7c9;color:#1b1b1b;align-self:flex-start;border-top-left-radius:4px}',
    '.from-user{background:#e3f2ff;color:#1b1b1b;align-self:flex-end;border-top-right-radius:4px}',
    '.bubble-text{margin:0;white-space:pre-wrap;word-break:break-word}',
    '.chat-input{margin-top:10px;display:flex;gap:8px}',
    '.chat-input input{flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#111;color:#fff}',
    '.chat-input button{padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.18);background:#222;color:#fff;cursor:pointer}',
    '.chat-owner{margin-top:14px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:12px}',
    '.owner-label{font-size:12px;opacity:.8;margin-bottom:6px}',
    '.owner-row{display:flex;gap:8px}',
    '.owner-row input{flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#111;color:#fff}',
    '.owner-row button{padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.18);background:#222;color:#fff;cursor:pointer}',

    '@media (prefers-reduced-motion:reduce){.thumb-img{transition:none}}'
  ].join('\n');

  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

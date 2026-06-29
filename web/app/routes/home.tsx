import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import type { Route } from "./+types/home";
import { FILMS } from "~/lib/corpus";
import type { SearchResultItem } from "~/lib/search.types";
import { PREVIEW_COUNT } from "~/lib/preview";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Nolan" },
    {
      name: "description",
      content:
        "Search across every Christopher Nolan film by meaning. Type a scene, a person, an object, a color.",
    },
  ];
}

type SearchResponse = { results?: SearchResultItem[]; error?: string };

type Drifter = {
  top: number; left: number; w: number; rot: number; op: number;
  dx: number; dy: number; dr: number; dur: number; delay: number; mobile: boolean;
};

// Deterministic brick-scatter that fills the whole idle canvas evenly (no center hole).
// Pure math (sin-hash), so server and client render identically — no hydration drift.
const COLS = 4;
const ROWS = Math.ceil(PREVIEW_COUNT / COLS);
const DRIFTERS: Drifter[] = Array.from({ length: PREVIEW_COUNT }, (_, i) => {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  const hash = (seed: number) => {
    const x = Math.sin((i + 1) * seed) * 43758.5453;
    return x - Math.floor(x); // stable 0..1
  };
  const a = hash(12.9898), b = hash(78.233), c = hash(3.17);
  // Brick rows offset half a column; jitter scatters them. Bounds keep every card fully
  // inside the canvas (no edge clipping): top stays clear of the container's top, left of
  // its right, and the float amplitude is small enough that drift never pushes a card out.
  const left = 2 + col * 22 + (row % 2 ? 11 : 0) + (a * 4 - 2);
  const top = 8 + (row / (ROWS - 1)) * 62 + (b * 8 - 4);
  return {
    top, // 4%..74%
    left: Math.min(76, left), // 0%..76%
    w: 120 + Math.round(a * 48), // 120–168px
    rot: c * 8 - 4, // -4..4deg
    op: 0.5 + b * 0.22, // 0.50..0.72
    dx: 4 + a * 5,
    dy: 5 + b * 4, // small lift so top cards never clip
    dr: 1.6 + c * 1.2,
    dur: 7 + b * 5, // 7–12s
    delay: (i % 5) * 0.35,
    mobile: col === 0 || col === 3, // on phones keep the outer columns only
  };
});

// Emil Kowalski's strong ease-out — built-in CSS easings are too weak. Enters ease *out*, never in.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type SearchState = {
  status: "idle" | "loading" | "done";
  results: SearchResultItem[];
  error?: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState<SearchResultItem | null>(null);
  const [search, setSearch] = useState<SearchState>({ status: "idle", results: [] });

  const busy = search.status === "loading";
  const results = search.results;
  const hasSearched = search.status !== "idle";

  // The API is a Hono endpoint outside React Router, so call it with a plain fetch.
  async function runSearch(q: string = query) {
    const text = q.trim();
    if (!text) return;
    setSearch({ status: "loading", results: [] });
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: text }),
      });
      const data = (await res.json()) as SearchResponse;
      setSearch({
        status: "done",
        results: res.ok ? (data.results ?? []) : [],
        error: res.ok ? undefined : (data.error ?? "Search failed."),
      });
    } catch {
      setSearch({ status: "done", results: [], error: "Network error — please try again." });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  // Return to a clean idle screen — discards the previous search entirely.
  function reset() {
    setQuery("");
    setLightbox(null);
    setSearch({ status: "idle", results: [] });
  }

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-14 sm:px-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Back to start"
                  className="cursor-pointer rounded transition-opacity hover:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-nolan-amber"
                >
                  Nolan
                </button>
              </h1>
              <p className="text-sm text-nolan-muted">visual semantic search</p>
            </div>
            <a
              href="https://github.com/Kenth06/Nolan"
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
              className="-mr-1 shrink-0 rounded-full p-2 text-nolan-muted transition-colors hover:text-nolan-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-nolan-amber"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-nolan-muted">
            Search across every Christopher Nolan film. Type a scene, a person, an object, a color,
            anything you remember.
          </p>
        </header>

        {/* Search */}
        <form onSubmit={onSubmit} className="sticky top-4 z-10">
          <div className="flex items-center gap-2 rounded-2xl border border-nolan-line bg-nolan-bg/80 p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl">
            <div className="flex flex-1 items-center gap-2 pl-3">
              <SearchIcon className="h-4 w-4 shrink-0 text-nolan-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="A scene, a person, an object, a color…"
                aria-label="Search Christopher Nolan's films"
                className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-nolan-muted"
              />
            </div>

            <motion.button
              type="submit"
              disabled={busy}
              whileTap={{ scale: 0.97 }}
              className="grid min-w-[84px] cursor-pointer place-items-center rounded-xl bg-nolan-ink px-5 py-2.5 text-sm font-medium text-nolan-bg transition-colors hover:bg-nolan-ink/85 disabled:cursor-default disabled:opacity-70"
            >
              {busy ? <Spinner /> : "Search"}
            </motion.button>
          </div>
        </form>

        {/* Body */}
        <section className="mt-10">
          {!hasSearched && <IdleState />}
          {busy && <SkeletonGrid />}
          {!busy && search.error && <ErrorState message={search.error} />}
          {!busy && hasSearched && !search.error && results.length === 0 && <NoResults />}
          {!busy && results.length > 0 && <ResultsGrid results={results} onOpen={setLightbox} />}
        </section>

        {/* Announce state changes to screen readers (the visual states are otherwise silent). */}
        <p aria-live="polite" className="sr-only">
          {busy
            ? "Searching…"
            : search.error
              ? search.error
              : !hasSearched
                ? ""
                : results.length === 0
                  ? "No matching stills."
                  : `${results.length} result${results.length === 1 ? "" : "s"}.`}
        </p>

        <AnimatePresence>
          {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}

function ResultsGrid({
  results,
  onOpen,
}: {
  results: SearchResultItem[];
  onOpen: (r: SearchResultItem) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {results.map((r, i) => (
        <motion.li
          key={r.id}
          initial={{ opacity: 0, transform: "translateY(10px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.28, ease: EASE_OUT, delay: Math.min(i * 0.025, 0.3) }}
        >
          <ResultTile item={r} onOpen={onOpen} />
        </motion.li>
      ))}
    </ul>
  );
}

function ResultTile({
  item,
  onOpen,
}: {
  item: SearchResultItem;
  onOpen: (r: SearchResultItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const f = FILMS.find((x) => x.slug === item.film);
  // A cached image can finish loading before React attaches onLoad; reconcile from the element.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  return (
    <button
      onClick={() => onOpen(item)}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-xl bg-nolan-surface-2 shadow-sm ring-1 ring-nolan-line transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-nolan-amber active:scale-[0.99]"
      aria-label={`Open still from ${f?.title ?? item.film}`}
    >
      <img
        ref={imgRef}
        src={item.thumbUrl}
        alt={`Still from ${f?.title ?? item.film} (${item.year})`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0 }}
        className="aspect-video w-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.04]"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-2.5 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="text-xs font-medium text-white">{f?.title ?? item.film}</span>
      </span>
    </button>
  );
}

function Lightbox({ item, onClose }: { item: SearchResultItem; onClose: () => void }) {
  const f = FILMS.find((x) => x.slug === item.film);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog, trap it (the close button is the only focusable child), and
  // restore focus to the triggering tile on close — so `aria-modal` is honoured for keyboard/SR.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Still from ${f?.title ?? item.film}`}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-nolan-ink/70 p-4 backdrop-blur-md sm:p-8"
    >
      <motion.figure
        className="max-h-full max-w-5xl cursor-default"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <img
          src={item.frameUrl}
          alt={`Still from ${f?.title ?? item.film} (${item.year})`}
          className="max-h-[78vh] w-auto rounded-xl shadow-2xl ring-1 ring-black/10"
        />
        <figcaption className="mt-4 flex items-center justify-between text-sm text-white">
          <span>
            <span className="font-medium">{f?.title ?? item.film}</span>{" "}
            <span className="text-white/60">({item.year})</span>
          </span>
          <span className="text-white/60">{item.dp}</span>
        </figcaption>
      </motion.figure>
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 cursor-pointer rounded-full border border-white/20 bg-white/10 p-2 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

function IdleState() {
  const reduce = useReducedMotion();

  return (
    <div className="relative isolate min-h-[520px] overflow-hidden sm:min-h-[560px]">
      {/* Scattered movie stills drifting across the page (decorative). Served as static assets
          (web/public/previews/0..15.webp), so the idle screen makes no API/D1 calls. */}
      {DRIFTERS.map((d, i) => (
        <DriftCard key={i} index={i} d={d} reduce={!!reduce} />
      ))}

      {/* Soft fade so the field melts into the page at the bottom. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-nolan-bg"
      />
    </div>
  );
}

function DriftCard({
  d,
  index,
  reduce,
}: {
  d: Drifter;
  index: number;
  reduce: boolean;
}) {
  const rest = `translate3d(0px, 0px, 0) rotate(${d.rot}deg)`;
  const lift = `translate3d(${d.dx}px, ${-d.dy}px, 0) rotate(${d.rot + d.dr}deg)`;
  return (
    <motion.div
      aria-hidden
      className={`absolute -z-0 ${d.mobile ? "" : "hidden sm:block"}`}
      style={{ top: `${d.top}%`, left: `${d.left}%`, width: `clamp(96px, 13vw, ${d.w}px)` }}
      // Entrance: fade + settle from scale 0.9 (never from nothing), staggered.
      initial={{ opacity: 0, transform: "scale(0.9)" }}
      animate={{ opacity: d.op, transform: "scale(1)" }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: Math.min(index * 0.05, 0.6) }}
    >
      {/* Inner layer owns the continuous, out-of-sync drift (transform-only, GPU). */}
      <motion.div
        style={{ transform: reduce ? `rotate(${d.rot}deg)` : undefined }}
        animate={reduce ? undefined : { transform: [rest, lift] }}
        transition={
          reduce
            ? undefined
            : {
                duration: d.dur,
                delay: d.delay,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }
        }
      >
        <img
          src={`/previews/${index}.webp`}
          alt=""
          loading="lazy"
          className="aspect-video w-full rounded-xl object-cover shadow-[0_10px_30px_-14px_rgba(0,0,0,0.45)] ring-1 ring-nolan-line"
        />
      </motion.div>
    </motion.div>
  );
}

function NoResults() {
  return (
    <div className="rounded-2xl border border-nolan-line bg-nolan-surface/50 p-12 text-center">
      <p className="font-medium">No matching stills</p>
      <p className="mt-1 text-sm text-nolan-muted">Try a broader or more visual description.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
      <p className="font-medium text-red-700">Search failed</p>
      <p className="mt-1 text-sm text-red-600/80">{message}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading results"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      {Array.from({ length: 15 }).map((_, i) => (
        <li
          key={i}
          className="aspect-video animate-pulse rounded-xl bg-nolan-surface ring-1 ring-nolan-line"
        />
      ))}
    </ul>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
// Fast spinner (0.6s) — a quicker spin makes loading *feel* faster (Emil: perceived performance).
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin [animation-duration:0.6s]"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Searching"
      role="status"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

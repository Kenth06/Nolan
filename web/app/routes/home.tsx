import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import type { Route } from "./+types/home";
import { FILMS } from "~/lib/corpus";
import type { SearchResultItem } from "~/lib/search.server";
import { getPreviewIds } from "~/lib/preview.server";

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

// Resolve the idle hero's stills to opaque public ids on the server.
export async function loader({ context }: Route.LoaderArgs) {
  return { previewIds: await getPreviewIds(context.cloudflare.env) };
}

type SearchResponse = { results?: SearchResultItem[]; error?: string };

type Drifter = {
  top: number; left: number; w: number; rot: number; op: number;
  dx: number; dy: number; dr: number; dur: number; delay: number; mobile: boolean;
};

// Deterministic brick-scatter that fills the whole idle canvas evenly (no center hole).
// Pure math (sin-hash), so server and client render identically — no hydration drift.
const PREVIEW_COUNT = 16; // number of drifting cards on the idle screen
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
  const { previewIds } = useLoaderData<typeof loader>();
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
          {!hasSearched && <IdleState previewIds={previewIds} />}
          {busy && <SkeletonGrid />}
          {!busy && search.error && <ErrorState message={search.error} />}
          {!busy && hasSearched && !search.error && results.length === 0 && <NoResults />}
          {!busy && results.length > 0 && <ResultsGrid results={results} onOpen={setLightbox} />}
        </section>

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
  const f = FILMS.find((x) => x.slug === item.film);
  return (
    <button
      onClick={() => onOpen(item)}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-xl bg-nolan-surface-2 shadow-sm ring-1 ring-nolan-line transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-nolan-amber active:scale-[0.99]"
      aria-label={`Open still from ${f?.title ?? item.film}`}
    >
      <img
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
      className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-nolan-ink/45 p-4 backdrop-blur-md sm:p-8"
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
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 cursor-pointer rounded-full border border-white/20 bg-white/10 p-2 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

function IdleState({ previewIds }: { previewIds: string[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative isolate min-h-[520px] overflow-hidden sm:min-h-[560px]">
      {/* Scattered movie stills drifting across the page (decorative). */}
      {previewIds.map((id, i) => {
        const d = DRIFTERS[i];
        if (!d) return null;
        return <DriftCard key={id} id={id} d={d} index={i} reduce={!!reduce} />;
      })}

      {/* Soft fade so the field melts into the page at the bottom. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-nolan-bg"
      />
    </div>
  );
}

function DriftCard({
  id,
  d,
  index,
  reduce,
}: {
  id: string;
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
          src={`/img/thumb/${id}`}
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import introUrl from "@/assets/ringvid3.mp4";
import loopUrl from "@/assets/rotate.mp4";

const joinWaitlist = createServerFn({ method: "POST" })
  .validator((email: string) => {
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      throw new Error("Invalid email");
    }
    return cleaned;
  })
  .handler(async ({ data: email }) => {
    const url = process.env.WAITLIST_WEBHOOK_URL;
    if (!url) throw new Error("WAITLIST_WEBHOOK_URL is not configured");
    const res = await fetch(url, {
      method: "POST",
      body: new URLSearchParams({ email }),
    });
    if (!res.ok) throw new Error(`Waitlist webhook failed: ${res.status}`);
    return { ok: true };
  });

export const Route = createFileRoute("/")({
  component: Index,
});

// Module scope: survives client-side navigations (e.g. manifesto -> home)
// but resets on a hard refresh, so the intro animation plays once per page
// load. Only ever mutated in the browser.
let introPlayed = false;

function Index() {
  const [revealed, setRevealed] = useState(introPlayed);
  // Whether the rotation loop is the visible layer. True from the start on
  // return navigations (intro already played this page load).
  const [looping, setLooping] = useState(introPlayed);
  // The intro element is unmounted shortly after the loop takes over. It
  // must not linger: browsers evict paused video data of background tabs,
  // and on tab restore the autoplay attribute replays the intro, whose
  // dropping ring bleeds through the loop's mask edges as a "ghost".
  const [showIntro, setShowIntro] = useState(!introPlayed);
  const [introVisible, setIntroVisible] = useState(false);
  const introRef = useRef<HTMLVideoElement | null>(null);
  const loopRef = useRef<HTMLVideoElement | null>(null);
  const loopStarted = useRef(false);

  const reveal = () => {
    introPlayed = true;
    setRevealed(true);
  };

  const startLoop = () => {
    if (loopStarted.current) return;
    loopStarted.current = true;
    reveal();
    setLooping(true);
    const loop = loopRef.current;
    if (loop) {
      loop.muted = true;
      loop.play().catch(() => {
        const retry = () => {
          loopRef.current?.play().catch(() => {});
          window.removeEventListener("pointerdown", retry);
          window.removeEventListener("keydown", retry);
        };
        window.addEventListener("pointerdown", retry, { once: true });
        window.addEventListener("keydown", retry, { once: true });
      });
    }
    // Drop the intro layer once the 150ms crossfade has fully completed.
    setTimeout(() => setShowIntro(false), 500);
  };

  useEffect(() => {
    if (introPlayed) return;
    const intro = introRef.current;
    if (intro && !intro.paused) {
      // Autoplay already running (Chrome honors the attribute before
      // hydration, so the `playing` event fired before React listened).
      setIntroVisible(true);
    } else if (intro) {
      intro.muted = true;
      intro.play().catch(() => startLoop());
    }
    // Backstop in case playback silently stalls without ever rejecting.
    const t = setTimeout(startLoop, 6000);
    return () => clearTimeout(t);
  }, []);

  // The video content is masked with a radial fade that reaches full
  // transparency exactly at the frame edges, so ring pieces entering from
  // outside the frame (start of the video) dissolve instead of hard-clipping.
  // The ring body itself never extends past ~65% of the half-frame, so it
  // always stays inside the fully-opaque region.
  const videoMask =
    "radial-gradient(ellipse 50% 50% at center, black 62%, transparent 98%)";

  return (
    <div
      className="relative w-full overflow-x-clip text-black antialiased"
      style={{
        // Same studio backdrop as before, but anchored to the hero's center
        // (50svh from the top) instead of the element center, so it renders
        // identically inside the hero and continues seamlessly — the radial's
        // final color extends — under the scroll sections below.
        background:
          "radial-gradient(120vmax 120vmax at 50% 50svh, #dbe1e8 0%, #d7dde4 40%, #d2d9df 100%)",
      }}
    >
      <section className="hero-stage relative h-svh w-full overflow-hidden">
        {/*
          Intro video (4:3) — plays once per page load, then hands off to the
          rotation loop. Stays mounted underneath as the bottom crossfade layer.
        */}
        {showIntro && (
          <video
            ref={introRef}
            src={introUrl}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={startLoop}
            // First real playback frame -> fade the intro in. Until then it
            // stays invisible so Safari's grey "not playing yet" placeholder
            // never shows (the weird oval shadow).
            onPlaying={() => setIntroVisible(true)}
            // Reveal the text slightly before the intro ends, and begin the
            // loop crossfade in the intro's final moments so the rotation is
            // already visible the instant the intro stops (the ring pose in
            // both layers matches, so the early start is imperceptible).
            // `ended` above stays as a backstop for coarse timeupdate ticks.
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (!v.duration) return;
              const remaining = v.duration - v.currentTime;
              if (remaining < 0.7) startLoop();
            }}
            // max-w-none: see the loop video below — without it the preflight
            // max-width clamp letterboxes this element on phones, shrinking
            // the ring and exposing the video's top edge past the mask fade.
            className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
              introVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: "var(--video-w)",
              height: "var(--video-h)",
              WebkitMaskImage: videoMask,
              maskImage: videoMask,
            }}
          />
        )}

        {/*
          Rotation loop (16:9) — sized and offset so its ring exactly overlaps
          the intro's resting ring (see --loop-h in styles.css), then crossfaded
          in over the intro's frozen last frame.
        */}
        <video
          ref={loopRef}
          src={loopUrl}
          loop
          muted
          playsInline
          preload="auto"
          autoPlay={!showIntro}
          // max-w-none: Tailwind preflight sets max-width:100% on <video>,
          // which clamps this wider-than-viewport 16:9 element on phones and
          // letterboxes the ring smaller at the intro -> loop handoff.
          className={`absolute left-1/2 top-1/2 max-w-none transition-opacity duration-150 ${
            looping ? "opacity-100" : "opacity-0"
          }`}
          style={{
            width: "var(--loop-w)",
            height: "var(--loop-h)",
            transform:
              "translate(-50%, -50%) translateY(calc(var(--video-h) * 0.0296))",
            WebkitMaskImage: videoMask,
            maskImage: videoMask,
          }}
        />

        <nav
          className={`absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-6 py-5 font-mono text-[8px] uppercase tracking-[0.3em] text-black/70 transition-opacity duration-[1400ms] ease-out md:px-14 md:py-6 md:text-[10px] md:tracking-[0.4em] ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
        >
          <Link to="/manifesto" className="transition hover:text-black">
            Manifesto
          </Link>
          {/* Cue that the page now continues below the hero */}
          <div aria-hidden="true" className="animate-blink text-black/50">
            Scroll
          </div>
          <div>© 2026 Synq Studios</div>
        </nav>

        {/*
          Wordmark — hugs the resting ring's top edge (not the frame edge, which
          has lots of empty backdrop above the ring), mirroring the waitlist
          below. Reveals together with the waitlist: fade + gentle settle.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-6"
          style={{
            bottom: "calc(50% + var(--ring-top-offset) + var(--ring-gap) - 23px)",
          }}
        >
          <div
            className={`w-full max-w-[clamp(17rem,60vw,24rem)] transition-[opacity,transform] duration-[1400ms] ease-out ${
              revealed ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
            }`}
          >
            <Wordmark
              className="h-auto w-full"
              style={{
                filter: "drop-shadow(0 12px 28px rgba(30, 41, 59, 0.22))",
              }}
            />
            <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.35em] text-black/50 md:mt-3 md:text-[9px]">
              Sovereign sensing — coming 2026
            </p>
          </div>
        </div>

        {/* Waitlist — anchored just below the resting ring's bottom edge */}
        <div
          className={`absolute inset-x-0 z-10 flex justify-center px-6 transition-opacity duration-[1400ms] ease-out ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: "calc(50% + var(--ring-bottom-offset) + var(--ring-gap))",
          }}
        >
          <WaitlistForm className="w-full max-w-[clamp(17rem,60vw,24rem)]" />
        </div>
      </section>

      <main className="relative z-10">
        <StatementSection />
        <PillarsSection />
        <FilmSection />
        <HardwareSection />
        <ClosingSection />
      </main>

      <footer className="relative z-10 flex items-center justify-between px-6 py-5 font-mono text-[8px] uppercase tracking-[0.3em] text-black/70 md:px-14 md:py-6 md:text-[10px] md:tracking-[0.4em]">
        <Link to="/manifesto" className="transition hover:text-black">
          Manifesto
        </Link>
        <div>© 2026 Synq Studios</div>
      </footer>

      <div className="stagelight" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll sections                                                     */
/* ------------------------------------------------------------------ */

function StatementSection() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-28 text-center md:py-44">
      <Reveal>
        <p className="font-mono text-[8px] uppercase tracking-[0.35em] text-black/50 md:text-[10px]">
          The premise
        </p>
        <h2 className="mx-auto mt-6 max-w-3xl font-serif text-[clamp(28px,5.5vw,54px)] leading-[1.15] tracking-tight">
          A ring that reads your body — and reports to no one.
        </h2>
        <p className="mx-auto mt-8 max-w-xl font-serif text-base leading-relaxed text-black/60 md:text-lg">
          Synq measures what matters — heart, temperature, movement, rest —
          and keeps every reading under your keys. No account required. No
          cloud between you and yourself.
        </p>
      </Reveal>
    </section>
  );
}

const PILLARS = [
  {
    label: "01 · Sense",
    text: "Continuous vitals from your finger. Heart rhythm, temperature, movement, rest — captured quietly, all day.",
  },
  {
    label: "02 · Store",
    text: "Your readings live encrypted on the ring and your own devices. Your keys, your hardware, your history.",
  },
  {
    label: "03 · Sync",
    text: "Share a snapshot with a doctor, a partner, an app — explicitly, and revocably. Nothing leaves without you.",
  },
];

function PillarsSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-28 md:px-14 md:pb-44">
      <div className="grid gap-12 md:grid-cols-3 md:gap-8">
        {PILLARS.map((pillar, i) => (
          <Reveal key={pillar.label} delayMs={i * 150}>
            <MediaPlaceholder className="aspect-[4/5]" />
            <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.35em] text-black/50 md:text-[10px]">
              {pillar.label}
            </p>
            <p className="mt-3 font-serif text-lg leading-snug tracking-tight md:text-xl">
              {pillar.text}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FilmSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-28 md:px-14 md:pb-44">
      <Reveal>
        <p className="text-center font-mono text-[8px] uppercase tracking-[0.35em] text-black/50 md:text-[10px]">
          A day with Synq
        </p>
        <div className="relative mt-8 aspect-video overflow-hidden border border-black/15">
          <TeaserVideo />
          <p className="absolute bottom-3 right-4 font-mono text-[8px] uppercase tracking-[0.3em] text-black/40 md:text-[9px]">
            Teaser — full film in production
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/**
 * The intro drop footage, reused as the film teaser. Plays once when it
 * scrolls into view and freezes on its final frame (the resting ring) —
 * looping it would jump-cut, since the clip isn't seamless.
 */
function TeaserVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={introUrl}
      muted
      playsInline
      preload="metadata"
      className="h-full w-full object-cover"
    />
  );
}

const HARDWARE = [
  {
    label: "Sealed body",
    text: "No ports. No microphone. Nothing to leak.",
  },
  {
    label: "Sensor array",
    text: "Optical, thermal, and motion sensing, tuned for the finger.",
  },
  {
    label: "Secure element",
    text: "Keys are minted on the ring and never leave it.",
  },
  {
    label: "Quiet battery",
    text: "Days of sensing on a single nightstand charge.",
  },
];

function HardwareSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-28 md:px-14 md:pb-44">
      <Reveal>
        <p className="text-center font-mono text-[8px] uppercase tracking-[0.35em] text-black/50 md:text-[10px]">
          The hardware
        </p>
        <h2 className="mx-auto mt-6 max-w-2xl text-center font-serif text-[clamp(24px,4vw,40px)] leading-[1.2] tracking-tight">
          Built closed on purpose.
        </h2>
      </Reveal>
      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-8">
        {HARDWARE.map((item, i) => (
          <Reveal key={item.label} delayMs={i * 120}>
            <MediaPlaceholder className="aspect-square" label="Render in production" />
            <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.35em] text-black/50 md:text-[10px]">
              {item.label}
            </p>
            <p className="mt-2 font-serif text-base leading-snug tracking-tight md:text-lg">
              {item.text}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-8 text-center md:pb-36">
      <Reveal>
        <div className="mx-auto w-full max-w-[clamp(14rem,40vw,18rem)]">
          <Wordmark className="h-auto w-full" />
        </div>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.35em] text-black/50 md:mt-3 md:text-[9px]">
          Sovereign sensing — coming 2026
        </p>
        <div className="mt-10 flex justify-center">
          <WaitlistForm className="w-full max-w-[clamp(17rem,60vw,24rem)]" />
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

/** Email capture — self-contained state so it can appear more than once. */
function WaitlistForm({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "invalid" | "sending" | "success" | "error"
  >("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    // Custom validation instead of the browser's native tooltip bubble,
    // which can't be styled and clashes with the design.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      await joinWaitlist({ data: email });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`relative border-b pb-1.5 text-left transition-colors duration-300 focus-within:border-black/80 md:pb-2 ${
        status === "invalid" ? "border-black/80" : "border-black/40"
      } ${className}`}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <input
          type="email"
          autoComplete="email"
          required
          aria-invalid={status === "invalid"}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "invalid") setStatus("idle");
          }}
          placeholder="Your email"
          className="flex-1 bg-transparent py-1.5 font-serif text-base text-black placeholder:text-black/40 focus:outline-none md:py-2 md:text-lg"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="group font-mono text-[8px] uppercase tracking-[0.3em] text-black/80 transition hover:text-black disabled:opacity-50 md:text-[10px] md:tracking-[0.4em]"
        >
          {status === "sending" ? (
            "Sending…"
          ) : status === "success" ? (
            "Received"
          ) : (
            <>
              {status === "error" ? "Retry" : "Reserve"}{" "}
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </>
          )}
        </button>
      </div>
      {/* Inline validation hint in the site's own mono-label voice */}
      <p
        aria-live="polite"
        className={`pointer-events-none absolute -bottom-6 left-0 font-mono text-[8px] uppercase tracking-[0.3em] text-black/50 transition-opacity duration-300 md:text-[9px] ${
          status === "invalid" ? "opacity-100" : "opacity-0"
        }`}
      >
        Enter a valid email
      </p>
    </form>
  );
}

/**
 * Fade-and-settle on first scroll into view, matching the hero's reveal
 * language (same easing family, slightly faster).
 */
function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      // Trigger once ~15% of the element has cleared the viewport bottom.
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[1200ms] ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Frame reserved for future footage/renders. Bordered like the film frame,
 * with a faint inner highlight so it reads as an intentional empty stage
 * rather than a broken image.
 */
function MediaPlaceholder({
  className = "",
  label = "Footage in production",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-black/15 ${className}`}
      style={{
        background:
          "radial-gradient(80% 80% at 50% 40%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)",
      }}
    >
      <p className="px-4 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-black/35 md:text-[9px]">
        {label}
      </p>
    </div>
  );
}

/**
 * Wordmark — "synq" set as SVG in a geometric-bold style echoing the uploaded logo
 * (heavy sans, low contrast, a distinctive rounded 'q' terminal). Not a copy of the
 * exact logo — a text-based wordmark in a similar spirit.
 */
function Wordmark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 260 100"
      className={className}
      style={style}
      aria-label="Synq"
      role="img"
    >
      <text
        x="130"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Nasalization', ui-sans-serif, system-ui, sans-serif"
        fontWeight="400"
        fontSize="72"
        letterSpacing="5.8"
        fill="currentColor"
      >
        synq
      </text>
    </svg>
  );
}

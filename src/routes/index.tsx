import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import videoUrl from "@/assets/ringvid3.mp4";

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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [revealed, setRevealed] = useState(introPlayed);

  const reveal = () => {
    introPlayed = true;
    setRevealed(true);
  };

  useEffect(() => {
    if (introPlayed) return;
    // Fallback in case the video never plays (e.g. iOS Low Power Mode
    // blocks autoplay) — the reveal must not depend on `ended` firing.
    const t = setTimeout(reveal, 6000);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || status === "sending") return;
    setStatus("sending");
    try {
      await joinWaitlist({ data: email });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  // The video content is masked with a radial fade that reaches full
  // transparency exactly at the frame edges, so ring pieces entering from
  // outside the frame (start of the video) dissolve instead of hard-clipping.
  // The ring body itself never extends past ~65% of the half-frame, so it
  // always stays inside the fully-opaque region.
  const videoMask =
    "radial-gradient(ellipse 50% 50% at center, black 62%, transparent 98%)";

  return (
    <div
      className="hero-stage relative h-svh w-screen overflow-hidden text-black antialiased"
      style={{
        // Mimics the video's studio backdrop (bright center, darker edges)
        // so the masked video fade is invisible against the page.
        background:
          "radial-gradient(120vmax 120vmax at 50% 50%, #dbe1e8 0%, #d7dde4 40%, #d2d9df 100%)",
      }}
    >
      {/* Background video — element sized to its exact 16:9 content box */}
      <video
        src={videoUrl}
        autoPlay={!introPlayed}
        muted
        playsInline
        preload="auto"
        // On return visits (client-side nav back from the manifesto) skip
        // straight to the settled final frame instead of replaying.
        onLoadedMetadata={(e) => {
          if (introPlayed) e.currentTarget.currentTime = e.currentTarget.duration;
        }}
        onEnded={reveal}
        // Start the reveal slightly before the video ends so the text
        // doesn't feel like it lags behind the settled ring.
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration && v.duration - v.currentTime < 0.7) reveal();
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "var(--video-w)",
          height: "var(--video-h)",
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
        <div>© 2026 Synq Studios</div>
      </nav>

      {/*
        Wordmark — hugs the resting ring's top edge (not the frame edge, which
        has lots of empty backdrop above the ring), mirroring the waitlist
        below. Reveals together with the waitlist: fade + gentle settle.
      */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-6"
        style={{ bottom: "calc(50% + var(--ring-top-offset) + var(--ring-gap) - 10px)" }}
      >
        <div
          className={`w-full max-w-[17rem] transition-[opacity,transform] duration-[1400ms] ease-out md:max-w-sm ${
            revealed ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
        >
          <Wordmark className="h-auto w-full" />
        </div>
      </div>

      {/* Waitlist — anchored just below the resting ring's bottom edge */}
      <div
        className={`absolute inset-x-0 z-10 flex justify-center px-6 transition-opacity duration-[1400ms] ease-out ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: "calc(50% + var(--ring-bottom-offset) + var(--ring-gap))" }}
      >
        <form
          onSubmit={onSubmit}
          className="w-full max-w-[17rem] border-b border-black/40 pb-1.5 md:max-w-sm md:pb-2"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 bg-transparent py-1.5 font-serif text-base text-black placeholder:text-black/40 focus:outline-none md:py-2 md:text-lg"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="font-mono text-[8px] uppercase tracking-[0.3em] text-black/80 transition hover:text-black disabled:opacity-50 md:text-[10px] md:tracking-[0.4em]"
            >
              {status === "sending"
                ? "Sending…"
                : status === "success"
                  ? "Received"
                  : status === "error"
                    ? "Retry →"
                    : "Reserve →"}
            </button>
          </div>
        </form>
      </div>


    </div>
  );
}

/**
 * Wordmark — "synq" set as SVG in a geometric-bold style echoing the uploaded logo
 * (heavy sans, low contrast, a distinctive rounded 'q' terminal). Not a copy of the
 * exact logo — a text-based wordmark in a similar spirit.
 */
function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 100"
      className={className}
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
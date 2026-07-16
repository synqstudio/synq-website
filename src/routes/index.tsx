import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import videoUrl from "@/assets/ring_explode.mp4";

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

function Index() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [revealed, setRevealed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 2400);
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
          "radial-gradient(120vmax 120vmax at 50% 50%, #e3e8ec 0%, #dfe4e9 40%, #d9dfe4 100%)",
      }}
    >
      {/* Background video — element sized to its exact 16:9 content box */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "var(--video-w)",
          height: "var(--video-h)",
          WebkitMaskImage: videoMask,
          maskImage: videoMask,
        }}
      />

      <nav className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-8 py-6 font-mono text-[10px] uppercase tracking-[0.4em] text-black/70 md:px-14">
        <Link to="/manifesto" className="transition hover:text-black">
          Manifesto
        </Link>
        <div>© 2026 Synq Studios</div>
      </nav>

      {/*
        Wordmark — anchored to the ring's aperture center in the paused frame,
        measured at (50.4%, 55.3%) of the 1280x720 video. Offsets are in video
        units so it stays locked to the ring at any viewport size, and its
        width scales with the ring (aperture is ~25% of the frame width).
      */}
      <div
        className={`pointer-events-none absolute z-10 transition-opacity duration-[1400ms] ease-out ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
        style={{
          left: "50%",
          top: "calc(50% + var(--video-h) * 0.008)",
          transform: "translate(-50%, -50%)",
          width: "calc(var(--video-w) * 0.21)",
        }}
      >
        <Wordmark className="h-auto w-full" />
      </div>

      {/* Waitlist — anchored just below the video's bottom edge */}
      <div
        className={`absolute inset-x-0 z-10 flex justify-center px-6 transition-opacity duration-[1400ms] ease-out ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: "calc(50% + var(--video-h) / 2 + 1.5rem)" }}
      >
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm border-b border-black/40 pb-2"
        >
          <div className="flex items-center gap-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 bg-transparent py-2 font-serif text-lg text-black placeholder:text-black/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/80 transition hover:text-black disabled:opacity-50"
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
        letterSpacing="2"
        fill="currentColor"
      >
        synq
      </text>
    </svg>
  );
}
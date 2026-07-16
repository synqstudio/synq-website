import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import videoUrl from "@/assets/ring_explode.mp4";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [revealed, setRevealed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    const list = JSON.parse(localStorage.getItem("synq_waitlist") ?? "[]");
    if (!list.includes(email)) list.push(email);
    localStorage.setItem("synq_waitlist", JSON.stringify(list));
    setStatus("success");
    setEmail("");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#e1e5ea] text-black antialiased">
      {/* Background video — sits on pure white, uncropped */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 object-contain md:h-[75%] md:w-[75%]"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 55% at center, black 30%, transparent 90%)",
          maskImage:
            "radial-gradient(ellipse 55% 55% at center, black 30%, transparent 90%)",
        }}
      />

      <nav className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-8 py-6 font-mono text-[10px] uppercase tracking-[0.4em] text-black/70 md:px-14">
        <Link to="/manifesto" className="transition hover:text-black">
          Manifesto
        </Link>
        <div>© 2026 Synq Studios</div>
      </nav>

      {/* Wordmark — anchored to the ring's optical center inside the video frame */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 flex translate-x-[calc(-50%+1.35vw)] translate-y-[calc(-50%+0.85vw)] items-center justify-center transition-opacity duration-[1400ms] ease-out ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      >
        <Wordmark className="h-14 w-auto md:h-20 lg:h-24" />
      </div>

      {/* Waitlist — pinned near the bottom, below the video frame */}
      <div
        className={`absolute inset-x-0 bottom-28 z-10 flex justify-center px-6 transition-opacity duration-[1400ms] ease-out md:bottom-32 ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
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
              className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/80 transition hover:text-black"
            >
              {status === "success" ? "Received" : "Reserve →"}
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
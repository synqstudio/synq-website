import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/manifesto")({
  component: Manifesto,
  head: () => ({
    meta: [
      { title: "Manifesto — Synq Studios" },
      {
        name: "description",
        content:
          "Sense freely. Store sovereignly. Sync on your own terms. The Synq manifesto.",
      },
      { property: "og:title", content: "Manifesto — Synq Studios" },
      {
        property: "og:description",
        content: "Sense freely. Store sovereignly. Sync on your own terms.",
      },
    ],
  }),
});

function Manifesto() {
  return (
    <div
      className="relative min-h-svh w-full text-black antialiased"
      style={{
        // Same backdrop as the home page (sampled from ringvid3.mp4) so
        // navigating between pages doesn't shift the background color.
        background:
          "radial-gradient(120vmax 120vmax at 50% 50%, #dbe1e8 0%, #d7dde4 40%, #d2d9df 100%)",
      }}
    >
      <main className="relative z-10 mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16 md:pl-16 md:pr-0 md:py-24">
        {/*
          Fluid type: sized so the longest line ("Sync on your own terms.")
          fills the padded viewport width on phones (book-like), capped at
          the 28px desktop size.
        */}
        <div className="space-y-6 font-serif text-[clamp(18px,calc(7vw_-_3px),28px)] leading-[1.35] tracking-tight text-black md:space-y-8 md:leading-[1.3]">
          {/*
            Set as verse: one sentence per line, so line breaks are authored
            rather than left to viewport wrapping.
          */}
          <p>
            Sense freely.
            <br />
            Store sovereignly.
            <br />
            Sync on your own terms.
          </p>

          {/* em-based so it tracks the fluid stanza size at every viewport */}
          <p className="pt-1 font-[Nasalization] text-[0.86em] tracking-[0.08em]">
            synq
          </p>
        </div>
      </main>

      <nav className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-6 py-5 font-mono text-[8px] uppercase tracking-[0.3em] text-black/70 md:px-14 md:py-6 md:text-[10px] md:tracking-[0.4em]">
        <Link to="/" className="transition hover:text-black">
          Waitlist
        </Link>
        <div>© 2026 Synq Studios</div>
      </nav>

      <div className="stagelight stagelight--left" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
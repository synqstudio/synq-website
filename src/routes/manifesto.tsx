import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/manifesto")({
  component: Manifesto,
  head: () => ({
    meta: [
      { title: "Manifesto — Synq Studios" },
      {
        name: "description",
        content:
          "Own what listens. Question what answers. Understand what understands you. The Synq manifesto.",
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
        <div className="space-y-5 font-serif text-lg leading-[1.35] tracking-tight text-black md:space-y-8 md:text-[28px] md:leading-[1.3]">
          {/*
            Set as verse, not prose: one sentence per line, so line breaks are
            authored rather than left to viewport wrapping. The closing stanza
            is italic — the tonal turn from vigilance to release.
          */}
          <p>
            Own what listens.
            <br />
            Question what answers.
          </p>

          <p>Understand what understands you.</p>

          <p>
            Trust nothing you cannot read.
            <br />
            Read everything you are asked to trust.
          </p>

          <p>Keep your signals close, and your keys closer.</p>

          <p>
            Sense freely.
            <br />
            Store sovereignly.
            <br />
            Sync on your own terms.
          </p>

          <p className="pt-1 font-[Nasalization] text-base tracking-[0.08em] md:text-2xl">
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
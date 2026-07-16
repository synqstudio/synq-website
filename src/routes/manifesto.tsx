import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/manifesto")({
  component: Manifesto,
  head: () => ({
    meta: [
      { title: "Manifesto — Synq Studios" },
      {
        name: "description",
        content:
          "Own what you wear. Wear what you understand. Understand what understands you. The Synq manifesto.",
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
    <div className="relative min-h-screen w-full bg-[#e1e5ea] text-black antialiased">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-8 py-24 md:px-0">
        <div className="space-y-8 font-serif text-2xl leading-[1.35] tracking-tight text-black md:text-[28px] md:leading-[1.3]">
          <p>Own what you wear. Wear what you understand.</p>

          <p>Understand what understands you.</p>

          <p>
            Keep your signals close. Keep your keys closer.
          </p>

          <p>
            Let the machine see through you. Never let it see past you.
          </p>

          <p>
            Trust nothing you cannot read. Read everything you are asked to trust.
          </p>

          <p>
            Sense freely. Store sovereignly. Sync on your own terms.
          </p>

          <p className="italic">synq</p>
        </div>
      </main>

      <nav className="absolute inset-x-0 bottom-0 flex items-center justify-between px-8 py-6 font-mono text-[10px] uppercase tracking-[0.4em] text-black/70 md:px-14">
        <Link to="/" className="transition hover:text-black">
          Waitlist
        </Link>
        <div>© 2026 Synq Studios</div>
      </nav>
    </div>
  );
}
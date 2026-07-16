import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  // Make .env values available to server
  // functions in dev; in production the host provides real env vars.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    server: { port: 8080 },
    plugins: [
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error wrapper). nitro/vite builds from this.
      tanstackStart({ server: { entry: "server" } }),
      // nitro packages the production server output; on Vercel/Cloudflare CI
      // it auto-detects the right preset, locally it targets Node.
      ...(command === "build" ? [nitro()] : []),
      viteReact(),
    ],
  };
});

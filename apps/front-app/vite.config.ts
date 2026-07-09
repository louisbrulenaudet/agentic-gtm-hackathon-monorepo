// apps/front-app/vite.config.ts

import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { DEV_API_BASE_URL, PROD_API_BASE_URL } from "./src/config/api-origin";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const analyzeBundle = process.env.ANALYZE === "true";
const repoRoot = path.resolve(appDir, "../..");

// Resolve the API origin baked into a build: an explicit `VITE_API_BASE_URL`
// override (shell env / `.env*`) wins, otherwise the mode's baked-in default
// from `src/config/api-origin.ts` (same source `env.ts` uses at runtime, so the
// bundle, this build guard, and the generated CSP all agree).
function resolveApiBaseUrl(mode: string): string {
  const override = loadEnv(mode, appDir, "VITE_").VITE_API_BASE_URL;
  return (
    override || (mode === "production" ? PROD_API_BASE_URL : DEV_API_BASE_URL)
  );
}

// A production origin is rejected when it is not a well-formed absolute
// http(s) URL with a real host, or is an obvious placeholder. This also
// catches a schemeless value (e.g. `localhost:8788`), which `new URL()`
// silently parses as a custom scheme with an empty host — yielding a `null`
// origin in the CSP instead of a hard failure.
function isInvalidProductionOrigin(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return true;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return true;
  }
  if (!url.hostname) {
    return true;
  }
  return (
    url.hostname.endsWith(".example.com") ||
    url.hostname.endsWith(".your-domain.com")
  );
}

function assertProductionOriginEnv(mode: string, command: string): void {
  const isStaticAnalysis = process.argv.some((arg) => arg.includes("knip"));
  if (isStaticAnalysis || command !== "build" || mode !== "production") {
    return;
  }

  const apiBaseUrl = resolveApiBaseUrl(mode);
  if (isInvalidProductionOrigin(apiBaseUrl)) {
    throw new Error(
      `Production frontend API origin is invalid or a placeholder: ${apiBaseUrl}. ` +
        "It must be an absolute http(s) URL. Fix PROD_API_BASE_URL in " +
        "src/config/api-origin.ts, or correct/unset VITE_API_BASE_URL.",
    );
  }
}

function cspHeaders(apiBaseUrl: string): string {
  const apiOrigin = new URL(apiBaseUrl).origin;
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${apiOrigin}`,
  ].join("; ");

  return [
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/*",
    "  Cache-Control: public, max-age=0, must-revalidate",
    `  Content-Security-Policy: ${csp}`,
    "  Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=()",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: DENY",
    "",
  ].join("\n");
}

function generatedHeadersPlugin(mode: string, command: string) {
  return {
    name: "generated-security-headers",
    apply: "build" as const,
    closeBundle() {
      if (command !== "build") {
        return;
      }

      writeFileSync(
        path.resolve(appDir, "dist/_headers"),
        cspHeaders(resolveApiBaseUrl(mode)),
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  assertProductionOriginEnv(mode, command);

  return {
    plugins: [
      devtools(),
      tanstackRouter({
        autoCodeSplitting: true,
        generatedRouteTree: "./src/routeTree.gen.ts",
        routeFileIgnorePattern: "routeTree\\.gen\\.ts",
        routesDirectory: "./src/routes",
        target: "react",
      }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      cloudflare(),
      generatedHeadersPlugin(mode, command),
      ...(analyzeBundle
        ? [
            visualizer({
              filename: "dist/stats.html",
              gzipSize: true,
              brotliSize: true,
              open: false,
            }),
          ]
        : []),
    ],

    resolve: {
      alias: {
        "@": path.resolve(appDir, "./src"),
        "@utils": path.resolve(appDir, "./src/utils"),
        "@enums": path.resolve(appDir, "./src/enums"),
        "@components": path.resolve(appDir, "./src/components"),
        "@ui": path.resolve(appDir, "./src/components/ui"),
        "@routes": path.resolve(appDir, "./src/routes"),
        "@pages": path.resolve(appDir, "./src/pages"),
        "@hooks": path.resolve(appDir, "./src/hooks"),
        "@services": path.resolve(appDir, "./src/services"),
        "@config": path.resolve(appDir, "./src/config"),
      },
    },

    css: {
      devSourcemap: true,
    },

    build: {
      target: "esnext",
      minify: "oxc",
      sourcemap: mode === "development" ? "inline" : "hidden",
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
      modulePreload: {
        polyfill: false,
      },
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/packages/dtos-common/")) {
              return "repo-dtos-common";
            }

            if (!id.includes("node_modules")) {
              return undefined;
            }
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/")
            ) {
              return "react-vendor";
            }

            if (id.includes("node_modules/@tanstack/react-router")) {
              return "tanstack-router-vendor";
            }

            if (id.includes("node_modules/@tanstack/")) {
              return "tanstack-query-vendor";
            }

            return "vendor";
          },
        },
      },
    },

    server: {
      host: true,
      port: 5174,
      strictPort: true,
      hmr: {
        overlay: true,
      },
      warmup: {
        clientFiles: ["./src/main.tsx", "./src/routes/__root.tsx"],
      },
      fs: {
        allow: [repoRoot],
        strict: true,
      },
    },

    preview: {
      port: 4174,
      strictPort: true,
    },

    optimizeDeps: {
      entries: ["index.html", "src/main.tsx"],
      include: [
        "react",
        "react-dom",
        "@tanstack/react-router",
        "@tanstack/react-query",
      ],
    },
  };
});

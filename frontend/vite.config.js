import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { startTunnel, stopTunnel } from "./src/utils/tunnelService.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env file directly using dotenv (for server-side variables)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env") });

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Load ngrok environment variables into process.env for the tunnel service
  // Use both dotenv (already loaded above) and Vite's loadEnv
  const ngrokToken = process.env.NGROK_AUTH_TOKEN || env.NGROK_AUTH_TOKEN;
  const ngrokRegion = process.env.NGROK_REGION || env.NGROK_REGION;

  if (ngrokToken) {
    process.env.NGROK_AUTH_TOKEN = ngrokToken;
  }
  if (ngrokRegion) {
    process.env.NGROK_REGION = ngrokRegion;
  }

  // Debug: Check if token is loaded (only in dev mode)
  if (mode === "development") {
    if (ngrokToken) {
      console.log("✅ NGROK_AUTH_TOKEN loaded from .env file");
    } else {
      console.warn(
        "⚠️  NGROK_AUTH_TOKEN not found. Make sure it's in frontend/.env file"
      );
    }
  }

  // Auto-enable tunnel if NGROK_AUTH_TOKEN is set, or if explicitly enabled
  const useTunnel =
    env.VITE_USE_TUNNEL === "true" ||
    (!!ngrokToken && env.VITE_USE_TUNNEL !== "false");

  return {
    plugins: [
      react(),
      useTunnel && {
        name: "ngrok-tunnel",
        configureServer: async (server) => {
          if (process.env.NODE_ENV !== "production") {
            let tunnelActive = false;

            const start = async () => {
              const address = server.httpServer.address();
              const port = address.port;
              try {
                // Small delay to let Vite show its initial messages first
                await new Promise((resolve) => setTimeout(resolve, 500));
                const url = await startTunnel(port);
                tunnelActive = Boolean(url);
              } catch (err) {
                console.warn(
                  "\n❌ Ngrok tunnel failed, continuing without tunnel:",
                  err?.message || err
                );
                console.warn(
                  "💡 Camera will NOT work on HTTP - you need HTTPS (ngrok)\n"
                );
              }
            };

            const stop = async () => {
              if (!tunnelActive) return;
              tunnelActive = false;
              await stopTunnel();
            };

            server.httpServer.once("listening", () => {
              void start();
            });

            server.httpServer.on("close", () => {
              void stop();
            });

            const handleShutdown = async () => {
              await stop();
            };

            process.once("SIGINT", async () => {
              await handleShutdown();
              process.exit(0);
            });

            process.once("SIGTERM", async () => {
              await handleShutdown();
              process.exit(0);
            });
          }
        },
      },
    ].filter(Boolean),
    server: {
      host: true, // Listen on all addresses
      allowedHosts: true, // Allow all hosts - no whitelist
    },
  };
});

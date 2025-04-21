import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import jsconfigPaths from "vite-jsconfig-paths"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), jsconfigPaths()],
    server: {
      host: "0.0.0.0",
      port: env.VITE_PORT,
    },
  }
});

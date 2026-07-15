import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import emailRouter from "./routes/email.js";
import { migrate } from "./migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5000;

async function main() {
  await migrate();

  const app = express();
  app.use(express.json({ limit: "10mb" }));

  app.use("/api/email", emailRouter);

  const httpServer = http.createServer(app);

  if (!isProd) {
    const vite = await createViteServer({
      root,
      configFile: path.join(root, "vite.config.ts"),
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(root, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(root, "dist", "index.html"));
    });
  }

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`[server] listening on port ${port} (${isProd ? "production" : "development"})`);
  });
}

main().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});

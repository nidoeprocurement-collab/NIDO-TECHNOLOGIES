import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import emailRouter from "./routes/email.js";
import quotesRouter from "./routes/quotes.js";
import exchangeRatesRouter from "./routes/exchangeRates.js";
import approvalsRouter from "./routes/approvals.js";
import { migrate } from "./migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5000;

async function main() {
  try {
    await migrate();
  } catch (err) {
    console.error(
      "[server] email database is not reachable yet — the app will still run, but Email Configuration/Templates/Logs and email sending will return an error until SUPABASE_DB_URL is fixed:",
      err.message,
    );
  }

  const app = express();
  app.use(express.json({ limit: "10mb" }));

  app.use("/api/email", emailRouter);
  app.use("/api/quotes", quotesRouter);
  app.use("/api/exchange-rates", exchangeRatesRouter);
  app.use("/api/approvals", approvalsRouter);
  app.get("/api/client-context", (req, res) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]?.trim();
    res.json({
      ip: forwardedIp || req.socket.remoteAddress || "Not available",
    });
  });

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

process.on("unhandledRejection", (err) => {
  console.error("[server] unhandled rejection (ignored to keep the app running):", err);
});

main().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});

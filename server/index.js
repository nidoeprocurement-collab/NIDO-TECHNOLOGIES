import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import emailRouter from "./routes/email.js";
import quotesRouter from "./routes/quotes.js";
import exchangeRatesRouter from "./routes/exchangeRates.js";
import approvalsRouter from "./routes/approvals.js";
import digitalFulfillmentsRouter from "./routes/digitalFulfillments.js";
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
      "[server] database is not reachable yet — the app will still run, but database-backed features will return an error until DATABASE_URL or SUPABASE_DB_URL is available:",
      err.message,
    );
  }

  const app = express();
  // License uploads are sent as base64 JSON. A 50 MB file needs roughly
  // 67 MB when encoded, plus request metadata.
  app.use(express.json({ limit: "75mb" }));

  app.use("/api/email", emailRouter);
  app.use("/api/quotes", quotesRouter);
  app.use("/api/exchange-rates", exchangeRatesRouter);
  app.use("/api/approvals", approvalsRouter);
  app.use("/api", digitalFulfillmentsRouter);
  app.get("/api/client-context", (req, res) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]?.trim();
    res.json({
      ip: forwardedIp || req.socket.remoteAddress || "Not available",
    });
  });

  app.use((error, _req, res, next) => {
    if (error?.type === "entity.too.large") {
      return res.status(413).json({
        success: false,
        error: "The request is too large. License files must be 50 MB or smaller.",
      });
    }
    return next(error);
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

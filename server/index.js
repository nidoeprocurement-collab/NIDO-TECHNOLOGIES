import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import authRouter from "./routes/auth.js";
import emailRouter from "./routes/email.js";
import quotesRouter from "./routes/quotes.js";
import exchangeRatesRouter from "./routes/exchangeRates.js";
import approvalsRouter from "./routes/approvals.js";
import autoAssignmentRouter from "./routes/autoAssignment.js";
import { migrate } from "./migrate.js";
import {
  clerkPrincipalMiddleware,
} from "./auth/clerkPrincipal.js";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware.js";

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
  app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
  app.use(express.json({ limit: "10mb" }));
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) || "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
  app.use(clerkPrincipalMiddleware);
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth/")) return next();
    if (!req.clerkUserId) {
      return res.status(401).json({ error: "unauthenticated" });
    }
    if (!req.authenticatedUser) {
      return res.status(403).json({ error: "account_not_provisioned" });
    }
    return next();
  });

  app.use("/api/auth", authRouter);
  app.use("/api/email", emailRouter);
  app.use("/api/quotes", quotesRouter);
  app.use("/api/exchange-rates", exchangeRatesRouter);
  app.use("/api/approvals", approvalsRouter);
  app.use("/api/auto-assignment", autoAssignmentRouter);
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

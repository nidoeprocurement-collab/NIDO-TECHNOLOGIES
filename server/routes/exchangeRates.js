import express from "express";

const router = express.Router();
const RATE_URL = "https://open.er-api.com/v6/latest/INR";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cachedRates = null;
let cachedAt = 0;

router.get("/", async (_req, res) => {
  if (cachedRates && Date.now() - cachedAt < CACHE_TTL_MS) {
    return res.json({ base: "INR", rates: cachedRates, fetchedAt: new Date(cachedAt).toISOString() });
  }

  try {
    const response = await fetch(RATE_URL);
    if (!response.ok) throw new Error(`upstream status ${response.status}`);
    const payload = await response.json();
    if (payload.result !== "success" || !payload.rates || typeof payload.rates.USD !== "number") {
      throw new Error("upstream returned an invalid exchange-rate payload");
    }

    cachedRates = { ...payload.rates, INR: 1 };
    cachedAt = Date.now();
    return res.json({ base: "INR", rates: cachedRates, fetchedAt: new Date(cachedAt).toISOString() });
  } catch (error) {
    console.error("[exchange-rates] unable to refresh rates:", error.message);
    return res.status(502).json({ error: "Exchange rates are temporarily unavailable" });
  }
});

export default router;
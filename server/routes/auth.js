import { Router } from "express";

const router = Router();

router.get("/me", (req, res) => {
  if (!req.clerkUserId) {
    return res.status(401).json({ error: "unauthenticated" });
  }
  if (!req.clerkAppProfile) {
    return res.status(403).json({ error: "account_not_provisioned" });
  }
  return res.json(req.clerkAppProfile);
});

export default router;

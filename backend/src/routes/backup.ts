import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";

const router = Router();
const backupsPath = collectionPath("backups.json");

router.get("/backup/download", requireAuth, authorize("system.admin"), async (_req, res) => {
  const data = await readJson<{ records: any[] }>(backupsPath);
  const latest = data.records.at(-1) ?? null;
  res.json({ backup: latest });
});

export default router;

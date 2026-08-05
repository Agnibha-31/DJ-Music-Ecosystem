import { Router } from "express";
import { authenticateOptional, authorize } from "../middleware/auth.js";
import { readJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
const router = Router();
const assetsPath = collectionPath("assets.json");
router.get("/assets/image", authenticateOptional, authorize("assets.read"), async (_req, res) => {
    const data = await readJson(assetsPath);
    const image = data.records.find((item) => item.type === "image") ?? null;
    res.json({ url: image?.url ?? null });
});
export default router;

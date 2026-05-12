import express from "express";
import {
  addStock,
  getStock,
  updateStock,
  getHistoryForUser,
} from "../controllers/stockController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addStock);
router.get("/", protect, getStock);
router.put("/:id", protect, updateStock);
router.get("/history/me", protect, getHistoryForUser);
router.get("/stock/count", async (req, res) => {
  const count = await Stock.countDocuments();
  res.json({ success: true, count });
});

export default router;

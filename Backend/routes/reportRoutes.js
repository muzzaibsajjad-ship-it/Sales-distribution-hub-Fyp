import express from "express";
import { getReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/reports", protect, getReport);

export default router;

import express from "express";
import {
  getVisibilityMatrix,
  toggleItemVisibility,
} from "../controllers/itemVisibilityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getVisibilityMatrix);
router.put("/toggle", protect, toggleItemVisibility);

export default router;

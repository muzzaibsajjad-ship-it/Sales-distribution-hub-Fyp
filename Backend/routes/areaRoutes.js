import express from "express";
import {
  createArea,
  getAreas,
  updateArea,
  toggleAreaStatus,
  assignAreasToFO,
  getFOList,
  getFOWithAreas,
  setMonthlyTarget,
  toggleFOStatus,
  getFOTarget,
  deleteArea,
} from "../controllers/areaController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Area CRUD operations
router.post("/create", createArea);
router.get("/", getAreas);
router.put("/:id", updateArea);
router.put("/:id/toggle-status", toggleAreaStatus);
router.delete("/:id", deleteArea);

// FO management
router.post("/assign", assignAreasToFO);
router.get("/fos", getFOList);
router.get("/fos/with-areas", getFOWithAreas);
router.put("/fo/:foId/target", setMonthlyTarget);
router.put("/fo/:foId/toggle-status", toggleFOStatus);
router.get("/fo/my-target", getFOTarget);

export default router;

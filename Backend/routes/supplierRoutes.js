import express from "express";
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  toggleSupplierStatus,
} from "../controllers/supplierController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSupplier);
router.get("/", protect, getSuppliers);
router.put("/:id", protect, updateSupplier);
router.put("/:id/toggle-status", protect, toggleSupplierStatus);

export default router;


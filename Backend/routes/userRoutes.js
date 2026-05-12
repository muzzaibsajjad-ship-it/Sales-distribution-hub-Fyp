import express from "express";
import {
  createUserByRole,
  getUsers,
  getUserById,
  deleteUser,
  updateProfile,
  toggleUserStatus,
  getBookers,
  assignAreaToBooker,
  setBookerTarget,
  toggleBookerStatus,
  getDistributorRequests,
  deleteDistributorRequest,
  approveDistributorRequest,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// All routes protected
router.post("/create", protect, createUserByRole);
router.get("/", protect, getUsers);
router.get("/distributor-requests", protect, getDistributorRequests);
router.delete("/distributor-requests/:id", protect, deleteDistributorRequest);
router.put("/distributor-requests/:id/approve", protect, approveDistributorRequest);

// Booker management routes (FO only) - MUST come BEFORE /:id routes
router.get("/bookers", protect, getBookers);
router.put("/booker/assign", protect, assignAreaToBooker);
router.put("/booker/:bookerId/target", protect, setBookerTarget);
router.put("/booker/:bookerId/toggle-status", protect, toggleBookerStatus);

// Generic routes - MUST come AFTER specific routes
router.get("/:id", protect, getUserById);
router.delete("/:id", protect, deleteUser);
router.put("/profile", protect, updateProfile);
router.put("/:id/toggle-status", protect, toggleUserStatus);

router.get("/users/count", async (req, res) => {
  const { role } = req.query;
  const count = await User.countDocuments({ role });
  res.json({ success: true, count });
});
export default router;

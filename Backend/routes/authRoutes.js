import express from "express";
import { registerUser, loginUser, submitDistributorApplication } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/distributor-application", submitDistributorApplication);

export default router;

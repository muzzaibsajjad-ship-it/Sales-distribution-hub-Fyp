import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import itemVisibilityRoutes from "./routes/itemVisibilityRoutes.js";
import orderRoutes from "./routes/orderRoutes.js"; // ✅ correctly imported
import dashboardRoutes from "./routes/dashoardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js"; 
import reportRoutes from "./routes/reportRoutes.js"; 
import areaRoutes from "./routes/areaRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import { ensureSoleExists } from "./createSole.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/visibility", itemVisibilityRoutes);
app.use("/api/orders", orderRoutes);
app.use("/uploads", express.static(uploadsDir));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", reportRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/suppliers", supplierRoutes);

// app.use("/api/stock-history", stockHistoryRoutes);

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureSoleExists();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();

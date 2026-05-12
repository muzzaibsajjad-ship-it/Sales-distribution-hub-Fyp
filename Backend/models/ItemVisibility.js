import mongoose from "mongoose";

const itemVisibilitySchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  visible: { type: Boolean, default: false },
});

// ✅ Safe export to prevent OverwriteModelError
export default mongoose.models.ItemVisibility ||
  mongoose.model("ItemVisibility", itemVisibilitySchema);

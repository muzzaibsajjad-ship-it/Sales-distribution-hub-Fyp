import ItemVisibility from "../models/ItemVisibility.js";
import Stock from "../models/Stock.js";
import User from "../models/User.js";

// 1️⃣ GET FULL VISIBILITY MATRIX
export const getVisibilityMatrix = async (req, res) => {
  try {
    const stocks = await Stock.find({ createdBy: req.user._id });
    const distributors = await User.find({ role: "distributer" });

    const visibility = await ItemVisibility.find();

    res.json({ stocks, distributors, visibility });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2️⃣ UPDATE / TOGGLE VISIBILITY
export const toggleItemVisibility = async (req, res) => {
  try {
    const { stockId, distributorId } = req.body;

    let record = await ItemVisibility.findOne({ stockId, distributorId });

    if (!record) {
      record = new ItemVisibility({ stockId, distributorId, visible: true });
    } else {
      record.visible = !record.visible;
    }

    await record.save();

    res.json({ message: "Updated successfully", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

import asyncHandler from "express-async-handler";
import Area from "../models/Area.js";
import User from "../models/User.js";

// Create Area (Distributor only)
export const createArea = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Area name is required");
  }

  // Check if area already exists for this distributor
  const existingArea = await Area.findOne({
    name,
    distributorId: req.user._id,
  });

  if (existingArea) {
    res.status(400);
    throw new Error("Area with this name already exists");
  }

  const area = await Area.create({
    name,
    distributorId: req.user._id,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: area });
});

// Get Areas - Distributor sees all their areas, FO sees only assigned areas
export const getAreas = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  let areas;

  if (role === "distributer") {
    // Distributor sees all their areas
    areas = await Area.find({ distributorId: userId })
      .populate("assignedFOs", "name email")
      .sort({ createdAt: -1 });
  } else if (role === "FO") {
    // FO sees only assigned areas
    areas = await Area.find({ assignedFOs: userId, isActive: true })
      .populate("distributorId", "name")
      .sort({ createdAt: -1 });
  } else {
    res.status(403);
    throw new Error("Access denied. Only Distributor and FO can view areas.");
  }

  res.json({ success: true, data: areas });
});

// Update Area (Distributor only)
export const updateArea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const area = await Area.findById(id);

  if (!area) {
    res.status(404);
    throw new Error("Area not found");
  }

  // Check if area belongs to this distributor
  if (area.distributorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this area");
  }

  if (name) area.name = name;

  const updatedArea = await area.save();

  res.json({ success: true, data: updatedArea });
});

// Toggle Area Status (Activate/Deactivate) - Distributor only
export const toggleAreaStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const area = await Area.findById(id);

  if (!area) {
    res.status(404);
    throw new Error("Area not found");
  }

  // Check if area belongs to this distributor
  if (area.distributorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this area");
  }

  area.isActive = !area.isActive;
  await area.save();

  res.json({
    success: true,
    data: area,
    message: area.isActive ? "Area activated" : "Area deactivated",
  });
});

// Assign Areas to FO (Distributor only)
export const assignAreasToFO = asyncHandler(async (req, res) => {
  const { foId, areaIds } = req.body;

  if (!foId || !areaIds || !Array.isArray(areaIds)) {
    res.status(400);
    throw new Error("FO ID and area IDs are required");
  }

  // Verify FO exists and belongs to this distributor
  const fo = await User.findOne({ _id: foId, role: "FO" });
  if (!fo) {
    res.status(404);
    throw new Error("FO not found or invalid role");
  }

  // Verify all areas belong to this distributor
  const areas = await Area.find({
    _id: { $in: areaIds },
    distributorId: req.user._id,
  });

  if (areas.length !== areaIds.length) {
    res.status(400);
    throw new Error("One or more areas not found or not owned by you");
  }

  // Check if any area is already assigned to another FO
  for (const area of areas) {
    if (area.assignedFOs.length > 0) {
      // Check if assigned to a different FO
      const otherFO = area.assignedFOs.find(
        (assignedFoId) => assignedFoId.toString() !== foId.toString()
      );
      if (otherFO) {
        const assignedFO = await User.findById(otherFO);
        res.status(400);
        throw new Error(
          `Area "${area.name}" is already assigned to ${assignedFO?.name || "another FO"}. One area cannot be assigned to multiple FOs.`
        );
      }
    }
  }

  // Update the FO's assigned areas
  await Area.updateMany(
    { _id: { $in: areaIds } },
    { $addToSet: { assignedFOs: foId } }
  );

  // Remove this FO from other areas not in the list (optional - unassign)
  await Area.updateMany(
    { _id: { $nin: areaIds }, assignedFOs: foId },
    { $pull: { assignedFOs: foId } }
  );

  res.json({
    success: true,
    message: `Areas assigned to FO successfully`,
  });
});

// Get FOs for Distributor (to assign areas)
export const getFOList = asyncHandler(async (req, res) => {
  const distributorId = req.user._id;

  // Get FOs created by this distributor
  const fos = await User.find({
    createdBy: distributorId,
    role: "FO",
  }).select("name email");

  res.json({ success: true, data: fos });
});

// Get FO with their assigned areas (for distributor to view)
export const getFOWithAreas = asyncHandler(async (req, res) => {
  const distributorId = req.user._id;

  // Get all FOs created by this distributor
  const fos = await User.find({
    createdBy: distributorId,
    role: "FO",
  }).select("name email isActive stockTarget targetMonth");

  // Get areas for each FO
  const fosWithAreas = await Promise.all(
    fos.map(async (fo) => {
      const areas = await Area.find({
        distributorId,
        assignedFOs: fo._id,
      }).select("name isActive");
      return {
        ...fo.toObject(),
        assignedAreas: areas,
      };
    })
  );

  res.json({ success: true, data: fosWithAreas });
});

// Set Monthly Target for FO
export const setMonthlyTarget = asyncHandler(async (req, res) => {
  const { foId } = req.params;
  const { target, month } = req.body;

  if (!foId || target === undefined || target === "") {
    res.status(400);
    throw new Error("FO ID and target quantity are required");
  }

  // Verify FO belongs to this distributor
  const fo = await User.findOne({
    _id: foId,
    role: "FO",
    createdBy: req.user._id,
  });

  if (!fo) {
    res.status(404);
    throw new Error("FO not found or not authorized");
  }

  fo.stockTarget = Number(target);
  fo.targetMonth = month || new Date().toISOString().slice(0, 7); // Default to current YYYY-MM
  await fo.save();

  res.json({
    success: true,
    message: `Stock target set to ${target} units for ${month || "current month"}`,
    data: fo,
  });
});

// Toggle FO Status (Activate/Deactivate)
export const toggleFOStatus = asyncHandler(async (req, res) => {
  const { foId } = req.params;

  // Verify FO belongs to this distributor
  const fo = await User.findOne({
    _id: foId,
    role: "FO",
    createdBy: req.user._id,
  });

  if (!fo) {
    res.status(404);
    throw new Error("FO not found or not authorized");
  }

  fo.isActive = !fo.isActive;
  await fo.save();

  res.json({
    success: true,
    message: fo.isActive ? "FO activated successfully" : "FO deactivated successfully",
    data: fo,
  });
});

// Get FO's own target and areas (for FO dashboard)
export const getFOTarget = asyncHandler(async (req, res) => {
  const foId = req.user._id;

  const fo = await User.findById(foId);
  if (!fo || fo.role !== "FO") {
    res.status(404);
    throw new Error("FO not found");
  }

  const areas = await Area.find({ assignedFOs: foId, isActive: true });

  res.json({
    success: true,
    data: {
      stockTarget: fo.stockTarget || 0,
      targetMonth: fo.targetMonth,
      assignedAreas: areas.map((a) => a.name),
      isActive: fo.isActive,
    },
  });
});

// Delete Area (Distributor only)
export const deleteArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const area = await Area.findById(id);

  if (!area) {
    res.status(404);
    throw new Error("Area not found");
  }

  // Check if area belongs to this distributor
  if (area.distributorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this area");
  }

  await Area.findByIdAndDelete(id);

  res.json({ success: true, message: "Area deleted successfully" });
});

export default {
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
};

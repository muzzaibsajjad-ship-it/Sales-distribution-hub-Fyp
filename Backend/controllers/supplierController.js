import asyncHandler from "express-async-handler";
import Supplier from "../models/Supplier.js";

// Create supplier
export const createSupplier = asyncHandler(async (req, res) => {
  const { name, phone, address, email, companyName } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Supplier name is required");
  }

  const supplier = await Supplier.create({
    name,
    phone: phone || "",
    address: address || "",
    email: email || "",
    companyName: companyName || "",
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: supplier });
});

// Get all suppliers for logged-in Sole
export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ createdBy: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, data: suppliers });
});

// Update supplier
export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }

  const { name, phone, address, email, companyName } = req.body;

  supplier.name = name ?? supplier.name;
  supplier.phone = phone ?? supplier.phone;
  supplier.address = address ?? supplier.address;
  supplier.email = email ?? supplier.email;
  supplier.companyName = companyName ?? supplier.companyName;

  const updated = await supplier.save();
  res.json({ success: true, data: updated });
});

// Toggle supplier status
export const toggleSupplierStatus = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }

  supplier.isActive = !supplier.isActive;
  await supplier.save();

  res.json({
    success: true,
    message: `Supplier ${supplier.isActive ? "activated" : "deactivated"}`,
    data: supplier,
  });
});


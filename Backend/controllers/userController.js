import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../helpers/sendEmail.js";
import { validatePassword, generateValidPassword } from "../helpers/passwordUtils.js";

// Role-based creation
export const createUserByRole = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const creatorRole = req.user.role; // logged-in user's role

  let roleToCreate;
  if (creatorRole === "sole") roleToCreate = "distributer";
  else if (creatorRole === "distributer") roleToCreate = "FO";
  else if (creatorRole === "FO") roleToCreate = "booker";
  else return res.status(403).json({ message: "You cannot create any user" });

  if (!validatePassword(password)) {
    res.status(400);
    throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const newUser = await User.create({
    name,
    email,
    password,
    role: roleToCreate,
    createdBy: req.user._id, // store creator
  });

  try {
    const subject = `Welcome to Our Platform - ${roleToCreate}`;
    const text = `Hello ${newUser.name},\n\nYour account has been successfully created as a ${roleToCreate}.\n\nYour login details are:\nEmail: ${newUser.email}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nThank you!`;
    const html = `<p>Hello ${newUser.name},</p><p>Your account has been successfully created as a <strong>${roleToCreate}</strong>.</p><p>Your login details are:</p><ul><li>Email: ${newUser.email}</li><li>Password: ${password}</li></ul><p>Please change your password after logging in.</p><p>Thank you!</p>`;
    await sendEmail({ to: newUser.email, subject, text, html });
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }

  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  });
});

// Get users created by logged-in user
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ createdBy: req.user._id })
    .populate("assignedArea", "name")
    .select(
      "_id name email role createdBy isActive createdAt stockTarget targetMonth bookerTarget routes assignedArea"
    );
  res.json(users);
});

// Get single user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("assignedArea", "name")
    .select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Only creator or admin can view details
  if (user.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "sole") {
    res.status(403);
    throw new Error("Not authorized to view this user");
  }

  res.json({ success: true, data: user });
});

// Delete user (only creator can delete)
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Only creator can delete
  if (user.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed to delete this user" });
  }

  await User.findByIdAndDelete(userId);
  res.json({ message: `${user.role} deleted successfully` });
});

// Get pending distributor applications submitted through the public form
export const getDistributorRequests = asyncHandler(async (req, res) => {
  if (req.user.role !== "sole") {
    res.status(403);
    throw new Error("Not authorized to view distributor applications");
  }

  const requests = await User.find({
    role: "distributer",
    $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
  }).select("name email phone address city investmentDetails applicationMessage createdAt");

  res.json({ success: true, data: requests });
});

// Delete a pending distributor application request
export const deleteDistributorRequest = asyncHandler(async (req, res) => {
  if (req.user.role !== "sole") {
    res.status(403);
    throw new Error("Not authorized to delete distributor application requests");
  }

  const requestUser = await User.findOne({
    _id: req.params.id,
    role: "distributer",
    $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
  });

  if (!requestUser) {
    res.status(404);
    throw new Error("Distributor application request not found");
  }

  await User.findByIdAndDelete(requestUser._id);
  res.json({ success: true, message: "Distributor request deleted successfully" });
});

export const approveDistributorRequest = asyncHandler(async (req, res) => {
  if (req.user.role !== "sole") {
    res.status(403);
    throw new Error("Not authorized to approve distributor application requests");
  }

  const requestUser = await User.findOne({
    _id: req.params.id,
    role: "distributer",
    isActive: false,
    $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
  });

  if (!requestUser) {
    res.status(404);
    throw new Error("Distributor application request not found or already approved");
  }

  const newPassword = generateValidPassword();
  requestUser.password = newPassword;
  requestUser.isActive = true;
  requestUser.createdBy = req.user._id;
  await requestUser.save();

  const subject = "Your distributor application has been approved";
  const text = `Hello ${requestUser.name},\n\nYour distributor account has been approved. You can log in using the credentials below:\n\nEmail: ${requestUser.email}\nPassword: ${newPassword}\n\nPlease log in and change your password immediately for security reasons.\n\nThank you,\nSole Distributor Team`;
  const html = `<p>Hello ${requestUser.name},</p><p>Your distributor account has been approved. You can log in with the credentials below:</p><ul><li><strong>Email:</strong> ${requestUser.email}</li><li><strong>Password:</strong> ${newPassword}</li></ul><p>Please log in and change your password immediately for security reasons.</p><p>Thank you,<br/>Sole Distributor Team</p>`;

  await sendEmail({
    to: requestUser.email,
    subject,
    text,
    html,
  });

  res.json({ success: true, message: "Distributor approved and email sent successfully." });
});

// Update logged-in user's profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email, password } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) {
    if (!validatePassword(password)) {
      res.status(400);
      throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.");
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  const updatedUser = await user.save();

  // Generate new JWT token with id and role
  const token = jwt.sign(
    { id: updatedUser._id, role: updatedUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    token, // frontend must store this
  });
});

// Toggle user status (sole can toggle distributor, distributor can toggle FO)
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Sole user can toggle distributor status
  if (req.user.role === "sole") {
    if (user.role === "distributer") {
      user.isActive = !user.isActive;
      await user.save();
      return res.json({
        success: true,
        message: user.isActive ? "Distributor activated" : "Distributor deactivated",
        isActive: user.isActive,
      });
    }
  }

  // Distributor can toggle FO status (existing functionality)
  if (user.role !== "FO") {
    res.status(400);
    throw new Error("Only FO status can be toggled by distributor");
  }

  // Only creator can toggle
  if (user.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to toggle this user");
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: user.isActive ? "FO activated" : "FO deactivated",
    isActive: user.isActive,
  });
});

// Get bookers created by FO
export const getBookers = asyncHandler(async (req, res) => {
  const foId = req.user._id;
  
  const bookers = await User.find({ 
    createdBy: foId, 
    role: "booker" 
  }).populate("assignedArea", "name").select(
    "_id name email role isActive bookerTarget targetMonth routes assignedArea"
  );
  
  res.json({ success: true, data: bookers });
});

// Assign area and routes to booker
export const assignAreaToBooker = asyncHandler(async (req, res) => {
  const { bookerId, areaId, routes } = req.body;
  const foId = req.user._id;

  // Verify booker exists and belongs to this FO
  const booker = await User.findOne({
    _id: bookerId,
    role: "booker",
    createdBy: foId,
  });

  if (!booker) {
    res.status(404);
    throw new Error("Booker not found or not authorized");
  }

  // If areaId is provided, verify it belongs to this FO's assigned areas
  if (areaId) {
    const Area = (await import("../models/Area.js")).default;
    const area = await Area.findOne({
      _id: areaId,
      assignedFOs: foId,
    });

    if (!area) {
      res.status(404);
      throw new Error("Area not found or not assigned to you");
    }

    booker.assignedArea = areaId;
  }

  // Update routes if provided
  if (routes && Array.isArray(routes)) {
    booker.routes = routes.filter(route => route.trim() !== "");
  }

  await booker.save();

  res.json({
    success: true,
    message: "Booker area and routes updated successfully",
    data: booker,
  });
});

// Set target for booker
export const setBookerTarget = asyncHandler(async (req, res) => {
  const { bookerId } = req.params;
  const { target, month } = req.body;
  const foId = req.user._id;

  if (target === undefined || target === "") {
    res.status(400);
    throw new Error("Target quantity is required");
  }

  // Verify booker belongs to this FO
  const booker = await User.findOne({
    _id: bookerId,
    role: "booker",
    createdBy: foId,
  });

  if (!booker) {
    res.status(404);
    throw new Error("Booker not found or not authorized");
  }

  booker.bookerTarget = Number(target);
  booker.targetMonth = month || new Date().toISOString().slice(0, 7);
  await booker.save();

  res.json({
    success: true,
    message: `Booker target set to ${target} units for ${month || "current month"}`,
    data: booker,
  });
});

// Toggle booker status (activate/deactivate)
export const toggleBookerStatus = asyncHandler(async (req, res) => {
  const { bookerId } = req.params;
  const foId = req.user._id;

  // Verify booker belongs to this FO
  const booker = await User.findOne({
    _id: bookerId,
    role: "booker",
    createdBy: foId,
  });

  if (!booker) {
    res.status(404);
    throw new Error("Booker not found or not authorized");
  }

  booker.isActive = !booker.isActive;
  await booker.save();

  res.json({
    success: true,
    message: booker.isActive ? "Booker activated successfully" : "Booker deactivated successfully",
    data: booker,
  });
});

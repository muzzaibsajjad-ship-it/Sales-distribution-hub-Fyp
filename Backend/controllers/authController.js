import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../helpers/sendEmail.js";
import { validatePassword, generateValidPassword } from "../helpers/passwordUtils.js";

// Generate JWT with role included
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register User
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  if (!validatePassword(password)) {
    res.status(400);
    throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password, role });
  if (user) {
    try {
      const subject = "Welcome to Our Platform";
      const text = `Hello ${user.name},\n\nYour account has been successfully created with the role of ${user.role}.\n\nThank you!`;
      const html = `<p>Hello ${user.name},</p><p>Your account has been successfully created with the role of <strong>${user.role}</strong>.</p><p>Thank you!</p>`;
      await sendEmail({ to: user.email, subject, text, html });
    } catch (error) {
      console.error("Email sending failed:", error.message);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role), // ✅ include role
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Login User
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // If role is provided, use it; otherwise find user by email only
  let user;
  if (role) {
    user = await User.findOne({ email, role }).populate('assignedArea', 'name');
  } else {
    user = await User.findOne({ email }).populate('assignedArea', 'name');
  }
   
  if (user && (await user.matchPassword(password))) {
    // Check if FO is active
    if (user.role === "FO" && user.isActive === false) {
      res.status(403);
      throw new Error("Your account has been deactivated. Please contact your distributor.");
    }
    
    // Check if booker is active
    if (user.role === "booker" && user.isActive === false) {
      res.status(403);
      throw new Error("Your account has been deactivated. Please contact your FO.");
    }
    
    // Check if distributor is active
    if (user.role === "distributer" && user.isActive === false) {
      res.status(403);
      throw new Error("Your account has been deactivated. Please contact your administrator.");
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      stockTarget: user.stockTarget,
      targetMonth: user.targetMonth,
      bookerTarget: user.bookerTarget,
      assignedArea: user.assignedArea ? user.assignedArea.name : null,
      routes: user.routes,
      token: generateToken(user._id, user.role), // ✅ include role
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// Submit distributor application (public)
export const submitDistributorApplication = asyncHandler(async (req, res) => {
  const { name, email, contact, address, city, investment, message } = req.body;

  // Basic validation
  if (!name || !email || !contact || !address || !city || !investment) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // Generate a random valid password
  const randomPassword = generateValidPassword();

  // Create user
  const user = await User.create({
    name,
    email,
    password: randomPassword,
    role: "distributer",
    phone: contact,
    address,
    city,
    investmentDetails: investment,
    applicationMessage: message,
    isActive: false, // distributor is not active until approved by sole
  });

  try {
    const subject = "Distributor Application Submitted";
    const text = `Hello ${user.name},\n\nYour distributor application has been received.\n\nYour temporary password is: ${randomPassword}\n\nYou will be notified once your application is approved.\n\nThank you!`;
    const html = `<p>Hello ${user.name},</p><p>Your distributor application has been received.</p><p>Your temporary password is: <strong>${randomPassword}</strong></p><p>You will be notified once your application is approved.</p><p>Thank you!</p>`;
    await sendEmail({ to: user.email, subject, text, html });
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }

  // We return the password so the frontend can show it to the user.
  res.status(201).json({
    success: true,
    message: "Distributor application submitted successfully. Please save your password.",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: randomPassword, // Only for immediate display, user should change it after login.
    }
  });
});

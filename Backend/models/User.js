import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["sole", "distributer", "FO", "booker"],
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // new field
    isActive: { type: Boolean, default: true }, // for FO/booker activation/deactivation
    stockTarget: { type: Number, default: 0 }, // monthly stock target for FO
    targetMonth: { type: String }, // format: YYYY-MM for the target month
    assignedArea: { type: mongoose.Schema.Types.ObjectId, ref: "Area" }, // assigned area for FO and booker
    // Distributor specific fields
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    investmentDetails: { type: String },
    applicationMessage: { type: String },
    // Booker specific fields
    routes: [{ type: String }], // routes assigned to booker
    bookerTarget: { type: Number, default: 0 }, // monthly target for booker
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password match
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

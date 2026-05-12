import User from "./models/User.js";

export const ensureSoleExists = async () => {
  try {
    const exists = await User.findOne({ role: "sole" });
    if (exists) {
      console.log("✅ Sole user already exists");
      return;
    }

    const sole = await User.create({
      name: "Sole Admin",
      email: "sole@company.com",
      password: "Sole@123",
      role: "sole",
    });

    console.log("🎉 Sole user created:", sole.email);
  } catch (err) {
    console.error("❌ Error creating default Sole user:", err.message);
  }
};

// Run standalone if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  import("./config/db.js")
    .then(({ default: connectDB }) => connectDB())
    .then(() => ensureSoleExists())
    .then(() => process.exit())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

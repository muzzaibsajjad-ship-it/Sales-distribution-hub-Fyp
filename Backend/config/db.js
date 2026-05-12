import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DB_CONNECTION;

    if (!mongoUri) {
      throw new Error("Missing MongoDB connection string. Set MONGO_URI in Backend/.env.");
    }

    await mongoose.connect(mongoUri);
    console.log("DB Connected Successfully!");
  } catch (error) {
    console.error("DB Connection Failed:", error);
    throw error;
  }
};

export default connectDB;

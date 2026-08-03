import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/tochy_rag";

  mongoose.connection.on("connected", () => {
    console.log(`[mongo] connected -> ${uri}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("[mongo] connection error:", err.message);
  });

  await mongoose.connect(uri);
  return mongoose.connection;
}

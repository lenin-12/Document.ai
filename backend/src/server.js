import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/apiRoutes.js";
import resumeRoutes from "./routes/resume.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { connectMongo } from "./config/mongo.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "AI PDF Chatbot API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);
app.use("/api/resume", resumeRoutes);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectMongo();
  } catch (error) {
    console.error("Failed to connect to MongoDB on startup:", error.message);
    console.error("the server will still start, but BM25 hybrid search will fail until MONGODB_URI is fixed.");
  }

  app.listen(PORT, () => {
    console.log(`Server running in production-ready mode on port ${PORT}`);
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your_openai")) {
      console.warn("⚠️ WARNING: OPENAI_API_KEY is missing or set to default placeholder in backend/.env!");
    }
  });
};

startServer();
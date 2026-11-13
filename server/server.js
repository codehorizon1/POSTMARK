import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import contactRoutes from "./routes/contactRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "POSTMARK API is running",
    status: "success",
  });
});

app.use("/api/contacts", contactRoutes);
app.use("/api/campaigns", campaignRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`POSTMARK API running at http://localhost:${PORT}`);
  });
};

startServer();
import express from "express";

import cookieParser from "cookie-parser";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
console.log("### NEW APP.JS VERSION - CORS TEST ###");



app.use(
  cors({
    origin: "https://e-commerce-frontend-ashy-theta.vercel.app",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

export default app;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

console.log("CLIENT_ORIGIN:", JSON.stringify(process.env.CLIENT_ORIGIN));

app.use((req, res, next) => {
  console.log("REQUEST ORIGIN:", JSON.stringify(req.headers.origin));
  next();
});

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

import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const PORT = Number.parseInt(process.env.PORT ?? "5002", 10);

await connectDB();

app.use("/api/products", productRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);


app.use("/api/payment", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


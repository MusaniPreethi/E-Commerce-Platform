import mongoose from "mongoose";

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    userId: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    dealId: { type: Schema.Types.ObjectId, ref: "Deal", required: false },
    pricePaid: { type: Number, required: true, min: 0 },
    address: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);

export default Order;


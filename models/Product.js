import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    category: { type: String, default: "", trim: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }
  },
  { timestamps: true }
);

const Product = mongoose.models.Product ?? mongoose.model("Product", productSchema);

export default Product;


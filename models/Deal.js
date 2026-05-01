import mongoose from "mongoose";

const { Schema } = mongoose;

const dealSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    creatorId: { type: String, default: "anonymous" },
    requiredUsers: { type: Number, required: true, min: 1 },
    joinedUsers: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["open", "completed", "expired"],
      default: "open",
      index: true
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true
    },
    discountPrice: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

const Deal = mongoose.models.Deal ?? mongoose.model("Deal", dealSchema);

export default Deal;


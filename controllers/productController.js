import mongoose from "mongoose";
import Product from "../models/Product.js";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getProducts(req, res) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "24", 10), 1), 100);
    const skip = Math.max(Number.parseInt(req.query.skip ?? "0", 10), 0);
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    let filter = {};
    if (category && q) {
      filter.$and = [
        { category },
        {
          $or: [
            { name: { $regex: escapeRegex(q), $options: "i" } },
            { description: { $regex: escapeRegex(q), $options: "i" } }
          ]
        }
      ];
    } else if (category) {
      filter = { category };
    } else if (q) {
      filter = {
        $or: [
          { name: { $regex: escapeRegex(q), $options: "i" } },
          { description: { $regex: escapeRegex(q), $options: "i" } }
        ]
      };
    }

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    return res.status(200).json({ items, total, limit, skip });
  } catch (err) {
    console.error("getProducts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getProductCategories(_req, res) {
  try {
    const raw = await Product.distinct("category");
    const categories = raw
      .filter((c) => typeof c === "string" && c.trim())
      .map((c) => c.trim())
      .sort((a, b) => a.localeCompare(b));
    return res.status(200).json(categories);
  } catch (err) {
    console.error("getProductCategories error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getMyProducts(req, res) {
  try {
    const isAdmin = req.user?.role === "admin";
    const isVendor = req.user?.role === "vendor";
    if (!isAdmin && !isVendor) return res.status(403).json({ message: "Forbidden" });

    const filter = isAdmin ? {} : { vendorId: req.user._id };
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10), 1), 200);
    const skip = Math.max(Number.parseInt(req.query.skip ?? "0", 10), 0);

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    return res.status(200).json({ items, total, limit, skip });
  } catch (err) {
    console.error("getMyProducts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (err) {
    console.error("getProductById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, price, description, image, category } = req.body ?? {};
    const vendorId = req.user?.role === "vendor" ? req.user._id : req.body?.vendorId;

    const product = await Product.create({
      name,
      price,
      description,
      image,
      category: typeof category === "string" ? category.trim() : "",
      vendorId
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const isAdmin = req.user?.role === "admin";
    const isVendorOwner =
      req.user?.role === "vendor" &&
      existing.vendorId &&
      String(existing.vendorId) === String(req.user._id);

    if (!isAdmin && !isVendorOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, price, description, image, category } = req.body ?? {};
    if (name != null) existing.name = name;
    if (price != null) existing.price = price;
    if (description != null) existing.description = description;
    if (image != null) existing.image = image;
    if (category != null) existing.category = typeof category === "string" ? category.trim() : "";

    await existing.save();
    return res.status(200).json(existing);
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const isAdmin = req.user?.role === "admin";
    const isVendorOwner =
      req.user?.role === "vendor" &&
      existing.vendorId &&
      String(existing.vendorId) === String(req.user._id);

    if (!isAdmin && !isVendorOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Product.deleteOne({ _id: existing._id });
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


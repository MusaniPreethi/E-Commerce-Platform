import "dotenv/config";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

// Loads ~190 real products (names, prices, descriptions, photos) from the free
// DummyJSON dataset (https://dummyjson.com) into your database.
// Run with:  node scripts/seed_dummyjson.js

const DATASET_URL = "https://dummyjson.com/products?limit=0";

// DummyJSON category -> category shown in your store
const CATEGORY_MAP = {
  laptops: "Electronics",
  smartphones: "Electronics",
  tablets: "Electronics",
  "mobile-accessories": "Electronics",

  furniture: "Home",
  "home-decoration": "Home",

  "kitchen-accessories": "Kitchen",
  groceries: "Kitchen",

  "mens-shirts": "Fashion",
  "mens-shoes": "Fashion",
  "mens-watches": "Fashion",
  sunglasses: "Fashion",
  tops: "Fashion",
  "womens-bags": "Fashion",
  "womens-dresses": "Fashion",
  "womens-jewellery": "Fashion",
  "womens-shoes": "Fashion",
  "womens-watches": "Fashion",

  "sports-accessories": "Sports",

  beauty: "Beauty",
  fragrances: "Beauty",
  "skin-care": "Beauty"
  // motorcycle and vehicle are skipped on purpose
};

function envOr(name, fallback) {
  const v = process.env[name];
  return v && String(v).trim() ? String(v).trim() : fallback;
}

async function upsertUser({ name, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.passwordHash = passwordHash;
    await existing.save();
    return existing;
  }

  return await User.create({ name, email: normalizedEmail, passwordHash, role });
}

async function loadDataset() {
  const res = await fetch(DATASET_URL);
  if (!res.ok) {
    throw new Error(`Could not download dataset (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (!Array.isArray(data.products)) {
    throw new Error("Unexpected dataset format (no products array)");
  }
  return data.products;
}

async function main() {
  await connectDB();

  const adminEmail = envOr("SEED_ADMIN_EMAIL", "admin@example.com");
  const adminPass = envOr("SEED_ADMIN_PASSWORD", "Admin@12345");
  const vendorEmail = envOr("SEED_VENDOR_EMAIL", "vendor@example.com");
  const vendorPass = envOr("SEED_VENDOR_PASSWORD", "Vendor@12345");
  const customerEmail = envOr("SEED_CUSTOMER_EMAIL", "customer@example.com");
  const customerPass = envOr("SEED_CUSTOMER_PASSWORD", "Customer@12345");

  await upsertUser({ name: "Admin", email: adminEmail, password: adminPass, role: "admin" });
  const vendor = await upsertUser({ name: "Vendor", email: vendorEmail, password: vendorPass, role: "vendor" });
  await upsertUser({ name: "Customer", email: customerEmail, password: customerPass, role: "customer" });

  console.log("Downloading dataset...");
  const source = await loadDataset();

  const products = [];
  for (const p of source) {
    const category = CATEGORY_MAP[p.category];
    if (!category) continue; // skip categories the store does not use

    const image = (typeof p.thumbnail === "string" && p.thumbnail) || (Array.isArray(p.images) && p.images[0]) || "";
    const price = Number(p.price);
    if (!p.title || !Number.isFinite(price) || price < 0) continue;

    products.push({
      name: String(p.title).trim(),
      price,
      description: typeof p.description === "string" ? p.description : "",
      image,
      category,
      vendorId: vendor._id
    });
  }

  // Replace the previously seeded products of the demo vendor
  await Product.deleteMany({ vendorId: vendor._id });
  await Product.insertMany(products);

  const perCategory = {};
  for (const p of products) perCategory[p.category] = (perCategory[p.category] ?? 0) + 1;

  console.log("Seed complete.");
  console.log("Accounts:");
  console.log(`- admin:    ${adminEmail} / ${adminPass}`);
  console.log(`- vendor:   ${vendorEmail} / ${vendorPass}`);
  console.log(`- customer: ${customerEmail} / ${customerPass}`);
  console.log(`Products seeded: ${products.length}`);
  console.log("By category:", perCategory);
}

try {
  await main();
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close().catch(() => {});
}

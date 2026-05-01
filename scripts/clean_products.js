import "dotenv/config";

import connectDB from "../config/db.js";
import Product from "../models/Product.js";

async function main() {
  await connectDB();

  // Get all categories
  const categories = await Product.distinct("category");

  for (const category of categories) {
    console.log(`Processing category: ${category}`);

    // Get all products in this category, sorted by createdAt (oldest first)
    const products = await Product.find({ category }).sort({ createdAt: 1 });
    if (products.length < 5) {
      console.log(`  Category has only ${products.length} products, deleting all.`);
      await Product.deleteMany({ category });
      continue;
    }
    if (products.length <= 5) {
      console.log(`  Already ${products.length} products, skipping.`);
      continue;
    }

    // Keep first 5, delete the rest
    const toDelete = products.slice(5);
    const idsToDelete = toDelete.map(p => p._id);

    console.log(`  Keeping 5, deleting ${toDelete.length} products.`);

    await Product.deleteMany({ _id: { $in: idsToDelete } });
  }

  console.log("Cleanup complete.");
}

main().catch(console.error);
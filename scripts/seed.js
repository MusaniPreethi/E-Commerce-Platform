import "dotenv/config";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

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

async function main() {
  await connectDB();

  const adminEmail = envOr("SEED_ADMIN_EMAIL", "admin@example.com");
  const adminPass = envOr("SEED_ADMIN_PASSWORD", "Admin@12345");

  const vendorEmail = envOr("SEED_VENDOR_EMAIL", "vendor@example.com");
  const vendorPass = envOr("SEED_VENDOR_PASSWORD", "Vendor@12345");

  const customerEmail = envOr("SEED_CUSTOMER_EMAIL", "customer@example.com");
  const customerPass = envOr("SEED_CUSTOMER_PASSWORD", "Customer@12345");

  const admin = await upsertUser({
    name: "Admin",
    email: adminEmail,
    password: adminPass,
    role: "admin"
  });

  const vendor = await upsertUser({
    name: "Vendor",
    email: vendorEmail,
    password: vendorPass,
    role: "vendor"
  });

  const customer = await upsertUser({
    name: "Customer",
    email: customerEmail,
    password: customerPass,
    role: "customer"
  });

  const count = Number.parseInt(envOr("SEED_PRODUCTS_COUNT", "1200"), 10);
  const total = Number.isFinite(count) && count > 0 ? count : 1200;

  const categoryItems = {
    "Electronics": [
      "Wireless Headphones",
      "Smart Watch",
      "USB-C Cable",
      "Phone Charger",
      "Laptop Stand",
      "Keyboard",
      "Computer Mouse",
      "Webcam",
      "USB Hub",
      "Power Bank",
      "Phone Case",
      "Screen Protector",
      "External SSD",
      "Bluetooth Speaker",
      "USB-C Adapter",
      "Gaming Mouse",
      "Mechanical Keyboard",
      "Wireless Charger",
      "Portable Monitor",
      "HD Camera"
    ],
    "Home": [
      "Wall Lamp",
      "Table Lamp",
      "Floor Lamp",
      "Desk Organizer",
      "Storage Box",
      "Wall Shelf",
      "Door Mat",
      "Throw Pillow",
      "Area Rug",
      "Wall Clock",
      "Picture Frame",
      "Curtain Rod",
      "Curtains",
      "Bedside Table",
      "Bookshelf",
      "Room Divider",
      "Wall Décor",
      "Mirror",
      "Furniture Set",
      "Couch"
    ],
    "Kitchen": [
      "Blender",
      "Toaster",
      "Coffee Maker",
      "Cutting Board",
      "Chef Knife",
      "Cookware Set",
      "Baking Pan",
      "Mixing Bowl",
      "Kitchen Scale",
      "Food Storage Container",
      "Bottle",
      "Thermos",
      "Measuring Cup",
      "Spatula Set",
      "Colander",
      "Whisk",
      "Tongs",
      "Grater",
      "Peeler",
      "Can Opener"
    ],
    "Fashion": [
      "Casual T-Shirt",
      "Denim Jeans",
      "Casual Shoes",
      "Sneakers",
      "Running Shoes",
      "Jacket",
      "Hoodie",
      "Sweater",
      "Casual Shorts",
      "Canvas Belt",
      "Casual Socks",
      "Summer Dress",
      "Casual Blazer",
      "Trousers",
      "Cardigan",
      "Tank Top",
      "Polo Shirt",
      "Sweatpants",
      "Casual Hat",
      "Scarf"
    ],
    "Sports": [
      "Running Shoes",
      "Yoga Mat",
      "Dumbbells",
      "Resistance Band",
      "Gym Bag",
      "Sports Water Bottle",
      "Fitness Tracker",
      "Jump Rope",
      "Foam Roller",
      "Yoga Block",
      "Exercise Ball",
      "Push-up Bar",
      "Swimming Goggles",
      "Badminton Racket",
      "Tennis Ball",
      "Skateboard",
      "Roller Skates",
      "Cycling Helmet",
      "Sports Watch",
      "Boxing Gloves"
    ],
    "Books": [
      "Fiction Novel",
      "Mystery Thriller",
      "Science Fiction",
      "Fantasy Adventure",
      "Self-Help Book",
      "Business Guide",
      "Cookbook",
      "Travel Guide",
      "Biography",
      "History Book",
      "Graphic Novel",
      "Poetry Collection",
      "Art Book",
      "Children's Book",
      "Educational Book",
      "Romance Novel",
      "Horror Story",
      "Philosophy Book",
      "Science Book",
      "Programming Guide"
    ],
    "Toys": [
      "Action Figure",
      "Building Blocks",
      "Puzzle Game",
      "Board Game",
      "Toy Car",
      "Doll Set",
      "Robot Toy",
      "Superhero Figure",
      "Lego Set",
      "Dinosaur Model",
      "Animal Figure",
      "Coloring Book",
      "Toy Train",
      "Playing Cards",
      "Marble Run",
      "Toy Plane",
      "Spinning Top",
      "Jigsaw Puzzle",
      "Model Kit",
      "Dice Game"
    ],
    "Beauty": [
      "Face Moisturizer",
      "Facial Cleanser",
      "Anti-Aging Cream",
      "Lip Balm",
      "Face Mask",
      "Body Lotion",
      "Shampoo",
      "Conditioner",
      "Hair Serum",
      "Perfume",
      "Eau de Cologne",
      "Hydrating Toner",
      "Face Sunscreen",
      "Eye Cream",
      "Face Scrub",
      "Night Cream",
      "Shower Gel",
      "Bath Bomb",
      "Beauty Brush Set",
      "Cosmetic Mirror"
    ]
  };

  const adjectives = [
    "Premium",
    "Smart",
    "Compact",
    "Portable",
    "Classic",
    "Eco",
    "Ultra",
    "Pro",
    "Deluxe",
    "Essential",
    "Advanced",
    "Luxury",
    "Basic",
    "Professional",
    "Everyday"
  ];

  const categoryImageKeywords = {
    "Electronics": ["gadgets", "tech", "smartphone", "laptop", "headphones", "keyboard", "monitor"],
    "Home": ["furniture", "interior", "lamp", "sofa", "shelves", "decor", "rug"],
    "Kitchen": ["cooking", "blender", "cookware", "kitchen", "utensils", "appliance", "pots"],
    "Fashion": ["clothing", "dress", "shoes", "fashion", "apparel", "jeans", "shirt"],
    "Sports": ["fitness", "yoga", "dumbbell", "sports", "athletic", "gym", "running"],
    "Books": ["books", "reading", "library", "novel", "literature", "bookshelf", "study"],
    "Toys": ["toys", "games", "lego", "playable", "puzzle", "playtime", "action figure"],
    "Beauty": ["makeup", "cosmetics", "lipstick", "skincare", "beauty", "perfume", "cosmetic"]
  };

  const categoryImageKeywords = {
    "Electronics": ["laptop", "smartphone", "headphones", "keyboard", "monitor", "charger", "mouse"],
    "Home": ["lamp", "sofa", "furniture", "interior", "decor", "shelf", "rug"],
    "Kitchen": ["blender", "cookware", "kitchen", "utensils", "appliance", "pots", "pan"],
    "Fashion": ["clothing", "shirt", "jeans", "dress", "shoes", "fashion", "apparel"],
    "Sports": ["yoga", "dumbbell", "fitness", "sports", "gym", "running", "workout"],
    "Books": ["books", "reading", "library", "novel", "literature", "bookshelf", "study"],
    "Toys": ["toys", "games", "lego", "puzzle", "playtime", "action figure", "blocks"],
    "Beauty": ["makeup", "cosmetics", "lipstick", "skincare", "beauty", "perfume", "cream"]
  };

  const categories = Object.keys(categoryItems);
  
  const products = Array.from({ length: total }, (_, i) => {
    const cat = categories[i % categories.length];
    const itemList = categoryItems[cat];
    const item = itemList[i % itemList.length];
    const adj = adjectives[i % adjectives.length];
    const price = Number((((i % 200) + 10) * 1.35).toFixed(2));
    
    // Use category-specific keywords for relevant images
    const keywords = categoryImageKeywords[cat];
    const keyword = keywords[i % keywords.length];
    
    return {
      name: `${adj} ${item}`,
      price,
      description: `${item} • ${adj} ${item} built for everyday use.`,
      image: `https://source.unsplash.com/800x600/?${keyword}`,
      category: cat
    };
  });

  // Ensure idempotency: clear previous seeded vendor products, then recreate
  await Product.deleteMany({ vendorId: vendor._id });
  const batchSize = 200;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize).map((p) => ({ ...p, vendorId: vendor._id }));
    // eslint-disable-next-line no-await-in-loop
    await Product.insertMany(batch);
  }

  console.log("Seed complete.");
  console.log("Accounts:");
  console.log(`- admin:    ${adminEmail} / ${adminPass}`);
  console.log(`- vendor:   ${vendorEmail} / ${vendorPass}`);
  console.log(`- customer: ${customerEmail} / ${customerPass}`);
  console.log(`Products seeded: ${products.length}`);
  console.log(`VendorId: ${vendor._id}`);
  console.log(`CustomerId: ${customer._id}`);
}

try {
  await main();
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close().catch(() => {});
}


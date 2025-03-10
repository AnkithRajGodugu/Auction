const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");

const app = express();

// Load environment variables (optional for local dev, required vars checked below)
const envConfig = dotenv.config({ path: "./.env" });
if (envConfig.error && envConfig.error.code !== "ENOENT") {
    console.error("Error loading .env file:", envConfig.error);
    process.exit(1);
}

// Check required environment variables
const requiredVars = ["MONGO_URL", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`Error: ${varName} is not defined.`);
        process.exit(1);
    }
});

// Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors({ origin: "https://auction-vrv8-rose.vercel.app" })); // Your Vercel frontend URL

// File Upload Setup (Temporary - Ephemeral on Render)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("Created uploads directory at:", uploadsDir);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });
app.use("/uploads", express.static(uploadsDir));

// Razorpay Setup
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Routes
const productRoutes = require("./routes/productroutes");
const authRoutes = require("./routes/authroutes");
app.use("/api", authRoutes);
app.use("/api", productRoutes(upload));

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URL) // Removed deprecated options
    .then(() => console.log("MongoDB Atlas connected successfully"))
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    });

// Start the server
const PORT = process.env.PORT || 5000; // Render provides PORT, fallback to 5000 for local dev
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// No need for module.exports unless deploying to a serverless platform
// module.exports = app; // Already commented out
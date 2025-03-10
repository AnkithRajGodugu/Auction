const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const multerS3 = require("multer-s3"); // Add this for S3 support
const AWS = require("aws-sdk"); // Add AWS SDK
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");

const app = express();

// Load environment variables
const envConfig = dotenv.config({ path: "./.env" });
if (envConfig.error && envConfig.error.code !== "ENOENT") {
    console.error("Error loading .env file:", envConfig.error);
    process.exit(1);
}

// Check required environment variables
const requiredVars = [
    "MONGO_URL",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "AWS_ACCESS_KEY_ID", // Add AWS credentials
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
    "AWS_REGION",
];
requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`Error: ${varName} is not defined.`);
        process.exit(1);
    }
});

// Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors({ origin: "https://auction-vrv8-rose.vercel.app" }));

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Multer S3 Storage Setup
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        acl: "public-read", // Make files publicly accessible (optional, adjust as needed)
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            cb(null, fileName); // Unique key for each file in S3
        },
    }),
});

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
    .connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB Atlas connected successfully"))
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    });

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
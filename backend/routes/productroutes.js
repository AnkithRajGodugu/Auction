const express = require("express");
const {
  getAllProducts,
  getUserProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  placeBid,
  confirmPayment,
} = require("../controllers/productcontroller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

module.exports = (upload) => {
  // Get all products (no auth required)
  router.get("/products", getAllProducts);

  // Get products for the authenticated user
  router.get("/user-products", authMiddleware, getUserProducts);

  // Create a new product with image upload to S3
  router.post("/products", authMiddleware, upload.single("image"), createProduct);

  // Place a bid on a product
  router.put("/products/:id/bid", authMiddleware, placeBid);

  // Confirm payment for a product
  router.post("/products/:id/confirm-payment", authMiddleware, confirmPayment);

  // Get a specific product by ID (no auth required)
  router.get("/products/:id", getProductById);

  // Update a product with optional image upload to S3
  router.put("/products/:id", authMiddleware, upload.single("image"), updateProduct);

  // Delete a product
  router.delete("/products/:id", authMiddleware, deleteProduct);

  return router;
};
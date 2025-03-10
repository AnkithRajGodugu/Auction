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
  
  router.get("/products", getAllProducts); 

  
  router.get("/user-products", authMiddleware, getUserProducts);
  router.post("/products", authMiddleware, upload.single("image"), createProduct); 
  router.put("/products/:id/bid", authMiddleware, placeBid); 
  router.post("/products/:id/confirm-payment", authMiddleware, confirmPayment); 
  router.get("/products/:id", getProductById); 
  router.put("/products/:id", authMiddleware, upload.single("image"), updateProduct); 
  router.delete("/products/:id", authMiddleware, deleteProduct);

  return router;
};
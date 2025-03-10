const mongoose = require("mongoose");
const Product = require("../models/product");
const User = require("../models/user");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate("auctionInfo.currentBidder", "name");
        res.json(products);
    } catch (error) {
        console.error("Error in getAllProducts:", error.message);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
};

const getUserProducts = async (req, res) => {
    try {
        if (!req.user?.id) return res.status(401).json({ message: "User not authenticated" });
        const products = await Product.find({ user: req.user.id }).populate("auctionInfo.currentBidder", "name");
        res.json(products);
    } catch (error) {
        console.error("Error in getUserProducts:", error.message);
        res.status(500).json({ message: "Error fetching user products", error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("auctionInfo.currentBidder", "name");
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        console.error("Error in getProductById:", error.message);
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        if (!req.user?.id) return res.status(401).json({ message: "Authentication required" });

        const { name, description, price, startingDate, endingDate, sellerInfo } = req.body;
        const requiredFields = { name, description, price, startingDate, endingDate };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value) return res.status(400).json({ message: `${key} is required` });
        }

        const parsedSellerInfo = sellerInfo ? JSON.parse(sellerInfo) : {};
        const sellerFields = ["username", "contactNumber", "email"];
        for (const field of sellerFields) {
            if (!parsedSellerInfo[field]) {
                return res.status(400).json({ message: `sellerInfo.${field} is required` });
            }
        }

        const productData = {
            name,
            description,
            price: parseFloat(price) || 0,
            startingDate: new Date(startingDate),
            endingDate: new Date(endingDate),
            sellerInfo: parsedSellerInfo,
            image: req.file ? req.file.location : null, // Use S3 URL
            auctionInfo: { status: "Open", currentPrice: 0, currentBidder: null },
            user: req.user.id,
        };

        const product = new Product(productData);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error("Error in createProduct:", error.message);
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, price, startingDate, endingDate, sellerInfo } = req.body;
        const updatedData = {};
        if (name) updatedData.name = name;
        if (description) updatedData.description = description;
        if (price) updatedData.price = parseFloat(price) || 0;
        if (startingDate) updatedData.startingDate = new Date(startingDate);
        if (endingDate) updatedData.endingDate = new Date(endingDate);
        if (sellerInfo) updatedData.sellerInfo = JSON.parse(sellerInfo);
        if (req.file) updatedData.image = req.file.location; // Use S3 URL

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updatedData,
            { new: true }
        ).populate("auctionInfo.currentBidder", "name");
        if (!product) return res.status(404).json({ message: "Product not found or not yours" });
        res.json(product);
    } catch (error) {
        console.error("Error in updateProduct:", error.message);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!product) return res.status(404).json({ message: "Product not found or not yours" });
        res.json({ message: "Product deleted" });
    } catch (error) {
        console.error("Error in deleteProduct:", error.message);
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
};

const placeBid = async (req, res) => {
    try {
        const { bidAmount } = req.body;
        const productId = req.params.id;

        if (!bidAmount || isNaN(bidAmount)) {
            return res.status(400).json({ message: "Bid amount is required and must be a number" });
        }
        if (!req.user?.id) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const now = new Date();
        const endDate = new Date(product.endingDate);
        if (endDate <= now) {
            product.auctionInfo.status = "Closed";
            await product.save();
            return res.status(400).json({ message: "Auction has ended" });
        }

        const basePrice = product.price || 0;
        const currentPrice = product.auctionInfo.currentPrice || basePrice;
        if (Number(bidAmount) < basePrice) {
            return res.status(400).json({ message: `Bid must be at least $${basePrice.toFixed(2)}` });
        }
        if (Number(bidAmount) <= currentPrice) {
            return res.status(400).json({ message: `Bid must be higher than $${currentPrice.toFixed(2)}` });
        }

        product.auctionInfo.currentPrice = Number(bidAmount);
        product.auctionInfo.currentBidder = req.user.id;
        await product.save();

        const updatedProduct = await Product.findById(productId).populate("auctionInfo.currentBidder", "name");
        res.json(updatedProduct);
    } catch (error) {
        console.error("Error in placeBid:", error.message);
        res.status(500).json({ message: "Error placing bid", error: error.message });
    }
};

const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ message: "Amount is required and must be a number" });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
        res.json({ orderId: order.id });
    } catch (error) {
        console.error("Error in createOrder:", error.message);
        res.status(500).json({ message: "Error creating payment order", error: error.message });
    }
};

const confirmPayment = async (req, res) => {
    try {
        const { productId, paymentId } = req.body;
        if (!productId || !paymentId) {
            return res.status(400).json({ message: "Product ID and Payment ID are required" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.auctionInfo.currentBidder.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not the winning bidder" });
        }

        product.auctionInfo.paymentId = paymentId;
        product.auctionInfo.status = "Paid";
        await product.save();

        const updatedProduct = await Product.findById(productId).populate("auctionInfo.currentBidder", "name");
        res.json({ message: "Payment confirmed", product: updatedProduct });
    } catch (error) {
        console.error("Error in confirmPayment:", error.message);
        res.status(500).json({ message: "Error confirming payment", error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getUserProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    placeBid,
    createOrder,
    confirmPayment,
};
const mongoose = require("mongoose");

const sellerInfoSchema = new mongoose.Schema({
  username: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, 
  startingDate: { type: Date, required: true }, 
  endingDate: { type: Date, required: true }, 
  sellerInfo: { type: sellerInfoSchema, required: true },
  image: { type: String },
  auctionInfo: {
    status: {
      type: String,
      default: "Open",
      enum: ["Open", "Closed", "Paid"],
    },
    currentPrice: { type: Number, default: 0 },
    currentBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      default: null,
    },
    paymentId: { type: String, default: null },
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
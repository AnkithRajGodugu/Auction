const mongoose = require("mongoose");
const Product = require("../models/product");

mongoose.connect("mongodb://localhost:27017/your-database-name", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixDates() {
  try {
    const products = await Product.find();
    for (const product of products) {
      if (typeof product.startingDate === "string" && product.startingDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = product.startingDate.split("/");
        product.startingDate = new Date(`${year}-${month}-${day}`);
      }
      if (typeof product.endingDate === "string" && product.endingDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = product.endingDate.split("/");
        product.endingDate = new Date(`${year}-${month}-${day}`);
      }
      await product.save();
      console.log(`Updated product ${product._id}`);
    }
    console.log("Date migration complete");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error fixing dates:", error);
  }
}

fixDates();
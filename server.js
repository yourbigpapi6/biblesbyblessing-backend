const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Load data at startup
let products = JSON.parse(fs.readFileSync("products.json"));
let sales = JSON.parse(fs.readFileSync("sales.json"));
let stock = JSON.parse(fs.readFileSync("stock.json"));

// GET products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// POST sale
app.post("/api/sale", (req, res) => {
  console.log("✅ Received sale request");
  const { cartItems } = req.body;
  console.log("🛒 Cart Items:", cartItems);

  if (!Array.isArray(cartItems)) {
    console.log("❌ Invalid or missing cartItems");
    return res.status(400).json({ message: "Invalid cart data" });
  }

  let totalProfit = 0;

  cartItems.forEach(item => {
    const stockItem = stock.find(p => p.id === item.id);
    if (stockItem) {
      stockItem.stock -= item.quantity;
      const profit = (item.price - stockItem.costPrice) * item.quantity;
      totalProfit += profit;
    }
  });

  const sale = {
    timestamp: new Date(),
    items: cartItems,
    profit: totalProfit
  };

  sales.push(sale);

  // Save updates to file
  fs.writeFileSync("sales.json", JSON.stringify(sales, null, 2));
  fs.writeFileSync("stock.json", JSON.stringify(stock, null, 2));

  console.log("✅ Sale recorded. Profit:", totalProfit.toFixed(2));
  res.json({ message: "Sale recorded", profit: totalProfit.toFixed(2) });
});

// GET report
app.get("/api/report", (req, res) => {
  const totalRevenue = sales.reduce((sum, sale) => {
    const saleTotal = sale.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    return sum + saleTotal;
  }, 0);
  res.json({ sales: sales.length, totalRevenue: totalRevenue.toFixed(2) });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
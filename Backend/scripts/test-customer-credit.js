require("dotenv").config();
const connectDB = require("../config/db");
const customerCreditController = require("../controllers/customerCreditController");

async function testCustomerCredit() {
  await connectDB();
  console.log("Testing Customer Credit controller...");
  const data = await customerCreditController.getAllBakkiEntries();
  console.log("Summary:", data.summary);
  console.log(`Total Bakki Entries fetched: ${data.entries.length}`);
  if (data.entries.length > 0) {
    console.log("First Bakki Entry sample:", data.entries[0]);
  }
  process.exit(0);
}

testCustomerCredit();

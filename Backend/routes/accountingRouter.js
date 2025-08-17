const express = require("express");
const router = express.Router();

const {
  getFinancialSummary,
  getTransactions,
} = require("../controllers/accountingController");
// const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const summary = await getFinancialSummary(startDate, endDate);

    res.json(summary);
  } catch (error) {
    console.error("Error in financial summary route:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const transactions = await getTransactions(startDate, endDate);

    res.json(transactions);
  } catch (error) {
    console.error("Error in transactions route:", error);
    res.status(500).json({ error: error.message });
  }
});

// router.get("/report", async (req, res) => {
//   try {
//     const reportContent = await accountingController.generateReport();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=financial-report.pdf"
//     );
//     res.send(reportContent); // In a real app, this would be a PDF stream
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

module.exports = router;

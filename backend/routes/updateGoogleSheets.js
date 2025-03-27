const express = require("express");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets");

const router = express.Router();

// ✅ Define the route
router.post("/updateGoogleSheets", async (req, res) => {
  try {
      const result = await updateGoogleSheets();
      res.json({ success: true, message: "Google Sheets updated successfully!", result });
  } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update Google Sheets", error: error.message });
  }
});


module.exports = router;

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const Candidate = require("../models/Candidate");

const credentialsPath = path.join(__dirname, "service-account.json");

async function updateGoogleSheets() {
    try {
        if (!fs.existsSync(credentialsPath)) {
            throw new Error("Google service account file not found!");
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });

        const spreadsheetId = "1JSiRnId-KbAHfm9ImPSwI4LR9cnX7WV6vX_oLm05Q1A"; // Using environment variable
        const range = "Votes!A2:C"; // Adjust range based on your sheet structure

        if (!spreadsheetId) {
            throw new Error("GOOGLE_SHEET_ID is not defined in environment variables.");
        }

        const candidates = await Candidate.find().select("name party voteCount");

        if (!candidates.length) {
            console.warn("⚠️ No candidates found in the database.");
            return { success: false, error: "No candidates found in the database." };
        }

        const values = candidates.map((c) => [c.name, c.party, c.voteCount]);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "RAW",
            requestBody: { values },
        });

        console.log("✅ Google Sheets updated successfully!");
        return { success: true };

    } catch (error) {
        console.error("❌ Error updating Google Sheets:", error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { updateGoogleSheets };

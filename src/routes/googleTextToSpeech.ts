// declare module "gtts";
import express from "express";
import fs from "fs";
import path from "path";
//@ts-ignore
import gtts from "gtts";
import isLoggedIn from "../middleware/isLoggedIn";

const router = express.Router();

router.get("/speak", isLoggedIn, async (req, res) => {
  const text = String(req.query.text || "Hello, this is a test speech"); // Get text from query params
  const lang = "hi"; // Nepali language

  if (!text.trim()) {
    return res.status(400).json({ error: "Text parameter is required" });
  }

  try {
    // Create a new instance of gTTS
    const tts = new gtts(text, lang);
    const filePath = path.join(__dirname, "temp.mp3");

    // Save the generated audio file
    tts.save(filePath, (err: any) => {
      if (err) {
        console.error("Error saving audio:", err);
        return res.status(500).json({ error: "Failed to generate speech" });
      } 

      res.sendFile(filePath, (err) => {
        if (err) console.error("Error sending file:", err);

        // Delete file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      });
    });
  } catch (error) {
    console.error("gTTS Error:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

module.exports = router;

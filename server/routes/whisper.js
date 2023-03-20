import express from "express";
import multer from "multer";
import axios from "axios";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure the Whisper ASR API URL and API key
const WHISPER_API_URL = "http://localhost:1337/whisper/transcribe";
const WHISPER_API_KEY = process.env.WHISPER_API_KEY;

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const audioBuffer = req.file.buffer;

    const response = await axios.post(
      WHISPER_API_URL,
      { data: audioBuffer.toString("base64") },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHISPER_API_KEY}`,
        },
      }
    );
    console.log("response:", response.data); // Add this line
    const transcription = response.data.transcript;
    res.status(200).json({ transcript: transcription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

export default router;

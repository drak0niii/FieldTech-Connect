import express from "express";
import multer from "multer";
import axios from "axios";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure the Whisper ASR API URL and API key
const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_API_KEY = process.env.WHISPER_API_KEY;

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const audioBuffer = req.file.buffer;
    console.log("audioBuffer:", audioBuffer);
    const response = await axios.post(
      WHISPER_API_URL,
      { 
        model: "whisper-1",
        data: audioBuffer.toString("base64")
      },
      {
        headers: {
          "Content-Type": "application/octet-stream",
          Authorization: `Bearer ${WHISPER_API_KEY}`,
        },
      }
    );
    console.log("response:", response.data); // Add this line
    const transcription = response.data.transcript;
    res.status(200).json({ transcript: transcription });
  } catch (error) {
    console.error("Whisper API error:", error.response ? JSON.stringify(error.response.data, null, 2) : error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    console.error("Request headers:", JSON.stringify(req.headers, null, 2));
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    console.error("Request file:", req.file);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

export default router;

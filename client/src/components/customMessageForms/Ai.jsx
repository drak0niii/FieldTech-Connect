import React, { useState, useRef } from "react";
import axios from "axios";
import MessageFormUI from "./MessageFormUI";

const Ai = ({ props, activeChat }) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  const handleRecordClick = () => {
    if (recording) {
      mediaRecorder.current.stop();
      setRecording(false);
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorder.current = new MediaRecorder(stream);
          mediaRecorder.current.start();

          mediaRecorder.current.ondataavailable = (event) => {
            recordedChunks.current.push(event.data);
          };

          mediaRecorder.current.onstop = async () => {
            const audioBlob = new Blob(recordedChunks.current, {
              type: "audio/webm",
            });
            recordedChunks.current = [];

            try {
              const formData = new FormData();
              formData.append("audio", audioBlob);
              const response = await axios.post("http://localhost:1337/whisper/transcribe", formData);
              const transcribedText = response.data.transcription;

              setMessage(transcribedText);
              setAttachment(audioBlob);
            } catch (error) {
              console.error("Error sending audio to Whisper:", error);
              console.error("Whisper API error:", error.response ? JSON.stringify(error.response.data, null, 2) : error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
            }
          };
        })
        .catch((err) => console.error("Error accessing microphone:", err));

      setRecording(true);
    }
  };

  const handleChange = (e) => setMessage(e.target.value);

  const handleSubmit = async () => {
    const date = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", `${Math.floor(Math.random() * 1000)}+00:00`);
    const at = attachment ? [{ blob: attachment, file: attachment.name }] : [];
    const form = {
      attachments: at,
      created: date,
      sender_username: props.username,
      text: message,
      activeChatId: activeChat.id,
    };

    props.onSubmit(form);
    setMessage("");
    setAttachment("");
  };

  return (
    <>
      <MessageFormUI
        setAttachment={setAttachment}
        message={message}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
      <button onClick={handleRecordClick}>
        {recording ? "Stop Recording" : "Record"}
      </button>
    </>
  );
};

export default Ai;

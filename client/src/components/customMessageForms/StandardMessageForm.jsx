import React, { useState, useEffect } from "react";
import MessageFormUI from "./MessageFormUI";

const StandardMessageForm = ({ props, activeChat }) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState("");

  const handleChange = (e) => setMessage(e.target.value);

  const handleSubmit = async () => {
    const date = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", `${Math.floor(Math.random() * 1000)}+00:00`);
    let at = [];
    if (attachment instanceof Blob) {
      at.push({ blob: attachment, file: "recording.wav" });
    } else {
      at = attachment ? [{ blob: attachment, file: attachment.name }] : [];
    }
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
    setPreview("");
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", (event) => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);

          setAttachment(audioBlob);
          setRecording(false);
          setPreview(audioUrl);
        });

        mediaRecorder.start();
        setRecording(true);
        setTimeout(() => {
          mediaRecorder.stop();
        }, 10000);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (recording) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const remaining = 10 - Math.floor((Date.now() - startTime) / 1000);
        setMessage(`Recording... ${remaining} seconds remaining`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [recording]);

  return (
    <MessageFormUI
      setAttachment={setAttachment}
      message={message}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      recording={recording}
      startRecording={startRecording}
      preview={preview}
    />
  );
};

export default StandardMessageForm;

import React, { useState, useRef } from "react";
import {
  useMultiChatLogic,
  MultiChatSocket,
  MultiChatWindow,
} from "react-chat-engine-advanced";
import axios from "axios";
import Header from "@/components/customHeader";
import StandardMessageForm from "@/components/customMessageForms/StandardMessageForm";
import Ai from "@/components/customMessageForms/Ai";
//import AiCode from "@/components/customMessageForms/AiCode";
//import AiAssist from "@/components/customMessageForms/AiAssist";

const Chat = ({ user, secret }) => {
  const chatProps = useMultiChatLogic(
    import.meta.env.VITE_PROJECT_ID,
    user,
    secret
  );

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordedChunks = useRef([]);

  const handleRecordClick = async () => {
    if (!navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support voice recording.");
      return;
    }

    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          recordedChunks.current.push(e.data);
        };
        recorder.onstop = async () => {
          const audioBlob = new Blob(recordedChunks.current, {
            type: "audio/webm",
          });

          const transcription = await sendAudioToWhisper(audioBlob);
          if (transcription) {
            chatProps.sendMessage(chatProps.activeChat, {
              text: transcription,
            });
          }
          recordedChunks.current = [];
        };
        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
      } catch (err) {
        console.error("Error starting voice recording:", err);
      }
    } else {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const sendAudioToWhisper = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await axios.post("/whisper/transcribe", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.transcription;
    } catch (err) {
      console.error("Error sending audio to Whisper:", err);
      return null;
    }
  };

  return (
    <div style={{ flexBasis: "100%" }}>
      <MultiChatSocket {...chatProps} />
      <MultiChatWindow
        {...chatProps}
        style={{ height: "100vh" }}
        renderChatHeader={(chat) => <Header chat={chat} />}
        renderMessageForm={(props) => {
          if (chatProps.chat?.title.startsWith("AiChat_")) {
            return <Ai props={props} activeChat={chatProps.chat} />;
          }
          if (chatProps.chat?.title.startsWith("AiCode_")) {
            return <AiCode props={props} activeChat={chatProps.chat} />;
          }
          if (chatProps.chat?.title.startsWith("AiAssist_")) {
            return <AiAssist props={props} activeChat={chatProps.chat} />;
          }

          return (
            <>
                            <button onClick={handleRecordClick}>
                {recording ? "Stop Recording" : "Record"}
              </button>
              <StandardMessageForm
                props={props}
                activeChat={chatProps.chat}
              />
            </>
          );
        }}
      />
    </div>
  );
};

export default Chat;

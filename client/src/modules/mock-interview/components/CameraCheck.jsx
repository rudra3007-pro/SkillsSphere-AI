import React, { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic } from "lucide-react";

const CameraCheck = ({ onStreamReady }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;
    let currentStream;

    const startCamera = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
        onStreamReady(true);

        // Audio Visualizer Logic
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(currentStream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = () => {
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;
          for (let i = 0; i < array.length; i++) {
            values += array[i];
          }
          const average = values / array.length;
          setMicLevel(Math.min(100, average * 2.5));
        };
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError("Camera or Microphone access denied. Please enable permissions to proceed.");
        onStreamReady(false);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  return (
    <div className="setup-card">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Video className="text-indigo-500" /> Device Setup
      </h3>
      
      <div className="camera-preview-wrapper">
        {error ? (
          <div className="permission-overlay">
            <div className="text-red-400">
              <VideoOff size={48} className="mx-auto mb-4" />
              <p>{error}</p>
            </div>
          </div>
        ) : !stream ? (
          <div className="camera-placeholder">
            <div className="animate-pulse flex flex-col items-center">
              <Video size={48} className="mb-4" />
              <p>Requesting camera access...</p>
            </div>
          </div>
        ) : null}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="camera-video"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-medium text-slate-400">
          <span className="flex items-center gap-2">
            <Mic size={16} /> Microphone Level
          </span>
          <span>{Math.round(micLevel)}%</span>
        </div>
        <div className="mic-visualizer">
          <div 
            className="mic-bar" 
            style={{ width: `${micLevel}%` }}
          />
        </div>
      </div>
      
      <p className="text-sm text-slate-400 italic">
        Tip: Ensure you are in a well-lit and quiet environment for the best experience.
      </p>
    </div>
  );
};

export default CameraCheck;

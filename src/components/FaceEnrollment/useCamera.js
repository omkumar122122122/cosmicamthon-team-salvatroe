import { useEffect, useRef, useState } from "react";

export default function useCamera() {
  const videoRef = useRef(null);

  const canvasRef = useRef(null);

  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);

  const [error, setError] = useState("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error(err);
      setError("Unable to access camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCameraReady(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;

    canvas.width = videoRef.current.videoWidth;

    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(videoRef.current, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.95);
  };

  useEffect(() => {
    startCamera();

    return () => stopCamera();
  }, []);

  return {
    videoRef,
    canvasRef,
    cameraReady,
    error,
    captureFrame,
    stopCamera,
    startCamera,
  };
}
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiCamera, FiCheckCircle, FiVideo } from "react-icons/fi";
import Button from "../Button";

export default function CameraRecorder({ onComplete, durationSeconds = 10 }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activeStream = null;
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn("Webcam access warning (fallback simulation active):", err);
        setError("Camera live feed unavailable. Simulated scan enabled.");
      }
    }
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartScan = () => {
    setIsRecording(true);
    setTimeLeft(durationSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRecording(false);
          setCaptured(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const progressPercent = Math.round(((durationSeconds - timeLeft) / durationSeconds) * 100);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Record Child's Face Scan</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Position child facing the camera for a 10-second facial expression scan
        </p>
      </div>

      {/* Video / Scanner Frame */}
      <div className="relative h-64 w-full max-w-md overflow-hidden rounded-2xl border-2 border-slate-300 bg-slate-950 shadow-inner dark:border-slate-800">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-center text-white">
            <FiCamera className="h-12 w-12 text-blue-400 animate-pulse mb-2" />
            <p className="text-xs font-bold text-slate-300">Simulated AI Face Scanner Active</p>
            {error && <p className="text-[11px] text-amber-400 mt-1">{error}</p>}
          </div>
        )}

        {/* AI Face Tracker Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`h-44 w-44 rounded-full border-2 border-dashed ${isRecording ? "border-emerald-400 animate-spin" : "border-blue-400/70"} transition-all duration-300`} />
          <div className="absolute h-36 w-36 rounded-3xl border border-blue-400/40" />
        </div>

        {/* Live Timer Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
          <span className={`h-2 w-2 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-emerald-400"}`} />
          <span>{isRecording ? `${timeLeft}s` : captured ? "Complete" : `${durationSeconds}s`}</span>
        </div>
      </div>

      {/* Recording Countdown Progress Bar */}
      {isRecording && (
        <div className="w-full max-w-md space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Scanning Facial Cues...</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isRecording && !captured && (
          <Button variant="primary" onClick={handleStartScan} className="flex items-center gap-2 px-6">
            <FiVideo className="h-4 w-4" /> Start 10s Scan
          </Button>
        )}

        {captured && (
          <Button variant="success" onClick={onComplete} className="flex items-center gap-2 px-6 bg-emerald-600 text-white">
            <FiCheckCircle className="h-4 w-4" /> Continue to Next Step
          </Button>
        )}
      </div>
    </div>
  );
}

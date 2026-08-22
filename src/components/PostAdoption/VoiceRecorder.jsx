import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMic, FiPlay, FiPause, FiRotateCcw, FiCheckCircle, FiVolume2 } from "react-icons/fi";
import Button from "../Button";

export default function VoiceRecorder({ onComplete, durationSeconds = 30 }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    setHasRecorded(false);
    setTimeLeft(durationSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRecording(false);
          setHasRecorded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleReplay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
    }, 4000);
  };

  const handleRetake = () => {
    setIsPlaying(false);
    setHasRecorded(false);
    setTimeLeft(durationSeconds);
  };

  const progressPercent = Math.round(((durationSeconds - timeLeft) / durationSeconds) * 100);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Record Child's Voice Sample</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ask the child to speak comfortably for 30 seconds to capture vocal pitch and tone signals
        </p>
      </div>

      {/* Audio Visualizer Box */}
      <div className="relative flex h-48 w-full max-w-md flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-900 to-indigo-950 p-6 shadow-inner dark:border-slate-800 text-white">
        {/* Animated Waveform Visualizer */}
        <div className="flex items-center gap-1.5 h-20">
          {[40, 70, 30, 90, 60, 100, 50, 85, 45, 95, 35, 75, 55].map((h, idx) => (
            <motion.div
              key={idx}
              className={`w-2 rounded-full ${isRecording || isPlaying ? "bg-emerald-400" : "bg-slate-600"}`}
              animate={
                isRecording || isPlaying
                  ? { height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] }
                  : { height: "20%" }
              }
              transition={{
                duration: 0.6,
                repeat: isRecording || isPlaying ? Infinity : 0,
                repeatType: "reverse",
                delay: idx * 0.05,
              }}
            />
          ))}
        </div>

        {/* Timer Badge */}
        <div className="mt-4 flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-1 text-xs font-bold backdrop-blur-md">
          <FiMic className={`h-4 w-4 ${isRecording ? "text-red-400 animate-pulse" : "text-emerald-400"}`} />
          <span>{isRecording ? `Recording: ${timeLeft}s` : hasRecorded ? "Voice Sample Saved" : "Ready to Record"}</span>
        </div>
      </div>

      {/* Recording Countdown Progress */}
      {isRecording && (
        <div className="w-full max-w-md space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Capturing Voice Pitch & Frequency...</span>
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
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!isRecording && !hasRecorded && (
          <Button variant="primary" onClick={startRecording} className="flex items-center gap-2 px-6">
            <FiMic className="h-4 w-4" /> Start 30s Recording
          </Button>
        )}

        {hasRecorded && (
          <>
            <Button variant="secondary" onClick={handleReplay} disabled={isPlaying} className="flex items-center gap-2 px-4">
              {isPlaying ? <FiVolume2 className="h-4 w-4 animate-bounce" /> : <FiPlay className="h-4 w-4" />}
              {isPlaying ? "Playing..." : "Replay"}
            </Button>

            <Button variant="secondary" onClick={handleRetake} className="flex items-center gap-2 px-4">
              <FiRotateCcw className="h-4 w-4" /> Retake
            </Button>

            <Button variant="success" onClick={onComplete} className="flex items-center gap-2 px-6 bg-emerald-600 text-white">
              <FiCheckCircle className="h-4 w-4" /> Continue to Questions
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

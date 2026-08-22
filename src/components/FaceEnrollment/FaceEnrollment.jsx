import React, { useState } from 'react';
import CameraView from './CameraView';
import PoseGuide from './PoseGuide';
import ProgressIndicator from './ProgressIndicator';
import CapturePreview from './CapturePreview';
import { useCamera } from './useCamera';
import { useFaceDetection } from './useFaceDetection';
import { usePoseGuide } from './usePoseGuide';
import { useAutoCapture } from './useAutoCapture';
import { ENROLLMENT_POSES } from './constants';
import { FiCamera, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

export default function FaceEnrollment({ onEnrollmentComplete, childName = 'Child' }) {
  const { videoRef, cameraActive, captureFrame } = useCamera();
  const { currentStepIndex, currentPose, totalSteps, nextStep, resetGuide } = usePoseGuide();
  const { qualityMetrics } = useFaceDetection(videoRef, currentPose);

  const [capturedPoses, setCapturedPoses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualCapture = () => {
    const frameBase64 = captureFrame();
    if (!frameBase64) return;

    const newCaptures = {
      ...capturedPoses,
      [currentPose.id]: {
        pose: currentPose.id,
        imageBase64: frameBase64,
        lightingQuality: qualityMetrics.lightingScore || 90,
        blurScore: qualityMetrics.blurScore || 88,
      },
    };

    setCapturedPoses(newCaptures);

    if (currentStepIndex < totalSteps - 1) {
      nextStep();
    }
  };

  const handleRetakePose = (poseId) => {
    const targetIdx = ENROLLMENT_POSES.findIndex((p) => p.id === poseId);
    if (targetIdx !== -1) {
      const updated = { ...capturedPoses };
      delete updated[poseId];
      setCapturedPoses(updated);
    }
  };

  const isAllCaptured = Object.keys(capturedPoses).length === totalSteps;

  const handleComplete = async () => {
    setIsSubmitting(true);
    const framesList = Object.values(capturedPoses);
    if (onEnrollmentComplete) {
      await onEnrollmentComplete(framesList);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Progress */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white font-display">
              AI Face Biometric Enrollment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capturing multi-angle poses for <strong className="text-[#0F172A] dark:text-white">{childName}</strong>
            </p>
          </div>
          <button
            onClick={() => {
              setCapturedPoses({});
              resetGuide();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <FiRefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        <div className="mt-3">
          <ProgressIndicator currentStepIndex={currentStepIndex} capturedPoses={capturedPoses} />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Camera Feed */}
        <div className="lg:col-span-7 space-y-4">
          <CameraView videoRef={videoRef} cameraActive={cameraActive} qualityMetrics={qualityMetrics} />

          <div className="flex gap-3">
            <button
              onClick={handleManualCapture}
              disabled={isAllCaptured}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3 text-xs font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiCamera className="h-4 w-4" /> Capture Pose ({currentStepIndex + 1}/{totalSteps})
            </button>
          </div>
        </div>

        {/* Right: Pose Instructions & Thumbnails */}
        <div className="lg:col-span-5 space-y-6">
          <PoseGuide currentPose={currentPose} currentStepIndex={currentStepIndex} totalSteps={totalSteps} />
          <CapturePreview capturedPoses={capturedPoses} onRetakePose={handleRetakePose} />

          {isAllCaptured && (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              <FiCheckCircle className="h-5 w-5" />
              {isSubmitting ? 'Saving Enrollment...' : 'Complete AI Enrollment & Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

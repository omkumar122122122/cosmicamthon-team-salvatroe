import { useState, useEffect } from 'react';
import { evaluateFaceQuality } from './faceQuality';

export function useFaceDetection(videoRef, activePose) {
  const [faceDetected, setFaceDetected] = useState(true);
  const [qualityMetrics, setQualityMetrics] = useState({
    isValid: true,
    lightingScore: 92,
    blurScore: 90,
    feedbackMessage: 'Hold steady',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef && videoRef.current) {
        const evalResult = evaluateFaceQuality(videoRef.current, activePose);
        setQualityMetrics(evalResult);
        setFaceDetected(evalResult.isValid);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [videoRef, activePose]);

  return { faceDetected, qualityMetrics };
}

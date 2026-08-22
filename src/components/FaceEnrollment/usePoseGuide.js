import { useState } from 'react';
import { ENROLLMENT_POSES } from './constants';

export function usePoseGuide() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentPose = ENROLLMENT_POSES[currentStepIndex] || ENROLLMENT_POSES[0];

  const nextStep = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, ENROLLMENT_POSES.length - 1));
  };

  const prevStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const resetGuide = () => {
    setCurrentStepIndex(0);
  };

  return {
    currentStepIndex,
    currentPose,
    totalSteps: ENROLLMENT_POSES.length,
    nextStep,
    prevStep,
    resetGuide,
  };
}

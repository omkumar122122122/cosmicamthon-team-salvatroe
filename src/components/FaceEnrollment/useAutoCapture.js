import { useState, useEffect } from 'react';

export function useAutoCapture(isQualityValid, onCapture) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let timer;
    if (isQualityValid) {
      setCountdown(2);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onCapture && onCapture();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }

    return () => clearInterval(timer);
  }, [isQualityValid]);

  return { countdown };
}

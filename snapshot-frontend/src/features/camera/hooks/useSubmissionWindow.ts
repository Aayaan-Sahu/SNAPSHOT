import { useState, useEffect } from "react";

const WINDOW_DURATION_MINUTES = 10;

type SubmissionStatus = {
  isWindowOpen: boolean;
  minutesRemaining: number;
}

export function useSubmissionWindow(): SubmissionStatus {
  const [status, setStatus] = useState<SubmissionStatus>(calculateStatus());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStatus(calculateStatus());
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return status;
}

function calculateStatus(): SubmissionStatus {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const isWindowOpen = currentMinute < WINDOW_DURATION_MINUTES;
  const minutesRemaining = isWindowOpen ? WINDOW_DURATION_MINUTES - currentMinute : 0;

  return {
    isWindowOpen,
    minutesRemaining,
  };
}
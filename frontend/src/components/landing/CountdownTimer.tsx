import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

// Landing page design system colors
const LANDING_COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  sunsetOrange: "#FF7043",
  darkForest: "#1B3A1A",
  creamWhite: "#FFF8E7",
} as const;

interface CountdownTimerProps {
  targetDate: Date;
  variant?: "default" | "light" | "compact";
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeBlock({
  value,
  label,
  variant,
}: {
  value: number;
  label: string;
  variant: "default" | "light" | "compact";
}) {
  const isLight = variant === "light";
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <span className="tabular-nums">
        {value.toString().padStart(2, "0")}
        <span className="text-xs opacity-70">{label[0]}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold tabular-nums sm:h-20 sm:w-20 sm:text-3xl"
        style={{
          backgroundColor: isLight
            ? "rgba(255, 255, 255, 0.2)"
            : LANDING_COLORS.forestGreen,
          color: isLight ? "white" : "white",
        }}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <span
        className="mt-1 text-xs font-medium tracking-wide uppercase sm:text-sm"
        style={{
          color: isLight
            ? "rgba(255, 255, 255, 0.8)"
            : LANDING_COLORS.darkForest,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({
  targetDate,
  variant = "default",
  onExpire,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  );
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      // Check if expired
      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        setIsExpired(true);
        onExpire?.();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (isExpired) {
    return (
      <div
        className="flex items-center gap-2 text-lg font-semibold"
        style={{ color: LANDING_COLORS.sunsetOrange }}
      >
        <Clock className="h-5 w-5" />
        Offer has ended
      </div>
    );
  }

  const isLight = variant === "light";
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <div
        className="flex items-center gap-1 text-sm font-semibold"
        style={{ color: LANDING_COLORS.sunsetOrange }}
      >
        <Clock className="h-4 w-4" />
        <TimeBlock value={timeLeft.days} label="days" variant="compact" />:
        <TimeBlock value={timeLeft.hours} label="hours" variant="compact" />:
        <TimeBlock value={timeLeft.minutes} label="minutes" variant="compact" />
        :
        <TimeBlock value={timeLeft.seconds} label="seconds" variant="compact" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Label */}
      <div
        className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase"
        style={{
          color: isLight
            ? "rgba(255, 255, 255, 0.9)"
            : LANDING_COLORS.forestGreen,
        }}
      >
        <Clock className="h-4 w-4" />
        Founding Family offer ends in
      </div>

      {/* Timer blocks */}
      <div className="flex items-center gap-2 sm:gap-4">
        <TimeBlock value={timeLeft.days} label="Days" variant={variant} />
        <span
          className="text-2xl font-bold"
          style={{ color: isLight ? "white" : LANDING_COLORS.darkForest }}
        >
          :
        </span>
        <TimeBlock value={timeLeft.hours} label="Hours" variant={variant} />
        <span
          className="text-2xl font-bold"
          style={{ color: isLight ? "white" : LANDING_COLORS.darkForest }}
        >
          :
        </span>
        <TimeBlock value={timeLeft.minutes} label="Mins" variant={variant} />
        <span
          className="text-2xl font-bold"
          style={{ color: isLight ? "white" : LANDING_COLORS.darkForest }}
        >
          :
        </span>
        <TimeBlock value={timeLeft.seconds} label="Secs" variant={variant} />
      </div>
    </div>
  );
}

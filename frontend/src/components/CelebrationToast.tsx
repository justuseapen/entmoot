/* eslint-disable react-refresh/only-export-components */
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import confetti from "canvas-confetti";

export type CelebrationType =
  | "badge"
  | "streak_milestone"
  | "first_goal"
  | "first_reflection"
  | "first_daily_plan"
  | "first_invitation_accepted";

interface CelebrationData {
  type: CelebrationType;
  title: string;
  description: string;
  icon: string;
  nextStep?: string;
}

interface CelebrationContextType {
  celebrate: (data: CelebrationData) => void;
  celebrateFirstAction: (
    actionType:
      | "first_goal"
      | "first_reflection"
      | "first_daily_plan"
      | "first_invitation_accepted"
  ) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within a CelebrationProvider");
  }
  return context;
}

// First action celebration configurations
const FIRST_ACTION_CELEBRATIONS: Record<
  | "first_goal"
  | "first_reflection"
  | "first_daily_plan"
  | "first_invitation_accepted",
  CelebrationData
> = {
  first_goal: {
    type: "first_goal",
    title: "You're off to a great start!",
    description: "You created your first goal!",
    icon: "🎯",
    nextStep: "Ready to set another goal?",
  },
  first_reflection: {
    type: "first_reflection",
    title: "You're off to a great start!",
    description: "You completed your first reflection!",
    icon: "🌟",
    nextStep: "Reflection is a powerful habit!",
  },
  first_daily_plan: {
    type: "first_daily_plan",
    title: "You're off to a great start!",
    description: "You completed your first daily plan!",
    icon: "📝",
    nextStep: "Planning helps you stay focused!",
  },
  first_invitation_accepted: {
    type: "first_invitation_accepted",
    title: "Welcome to the family!",
    description: "You joined your first family!",
    icon: "👨‍👩‍👧‍👦",
    nextStep: "Together you can achieve more!",
  },
};

// Fire confetti animation
function fireConfetti() {
  const duration = 2500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Confetti from both sides
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

export function CelebrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const celebrate = useCallback((data: CelebrationData) => {
    setCelebration(data);
    setIsVisible(true);

    // Fire confetti for first action celebrations
    if (data.type.startsWith("first_")) {
      fireConfetti();
    }
  }, []);

  const celebrateFirstAction = useCallback(
    (
      actionType:
        | "first_goal"
        | "first_reflection"
        | "first_daily_plan"
        | "first_invitation_accepted"
    ) => {
      const celebrationData = FIRST_ACTION_CELEBRATIONS[actionType];
      if (celebrationData) {
        celebrate(celebrationData);
      }
    },
    [celebrate]
  );

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <CelebrationContext.Provider value={{ celebrate, celebrateFirstAction }}>
      {children}
      {isVisible && celebration && (
        <CelebrationToast
          celebration={celebration}
          onClose={() => setIsVisible(false)}
        />
      )}
    </CelebrationContext.Provider>
  );
}

function CelebrationToast({
  celebration,
  onClose,
}: {
  celebration: CelebrationData;
  onClose: () => void;
}) {
  const isFirstAction = celebration.type.startsWith("first_");
  const isBadge = celebration.type === "badge";

  // Different gradient for first actions vs badges vs streaks
  let bgColor = "from-orange-500 to-amber-600"; // default for streaks
  if (isFirstAction) {
    bgColor = "from-green-500 to-emerald-600";
  } else if (isBadge) {
    bgColor = "from-purple-500 to-indigo-600";
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div
        className={`animate-bounce-in pointer-events-auto rounded-lg bg-gradient-to-r ${bgColor} p-1 shadow-xl`}
      >
        <div className="flex items-center gap-4 rounded-md bg-white px-6 py-4">
          <div className="text-5xl">{celebration.icon}</div>
          <div>
            <p className="font-bold text-gray-900">{celebration.title}</p>
            <p className="text-muted-foreground text-sm">
              {celebration.description}
            </p>
            {celebration.nextStep && (
              <p className="mt-1 text-xs text-green-600">
                {celebration.nextStep}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-gray-900"
          >
            &times;
          </button>
        </div>
      </div>
      <style>{`
        @keyframes bounce-in {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            transform: translateY(10%);
          }
          70% {
            transform: translateY(-5%);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

// Hook to listen for badge/streak milestone notifications and trigger celebration
export function useCelebrationListener() {
  const { celebrate } = useCelebration();

  const handleNotification = useCallback(
    (notification: {
      notification_type: string;
      title: string;
      body: string | null;
    }) => {
      if (notification.notification_type === "badge_earned") {
        celebrate({
          type: "badge",
          title: notification.title,
          description: notification.body || "You earned a new badge!",
          icon: "🏆",
        });
      } else if (notification.notification_type === "streak_milestone") {
        celebrate({
          type: "streak_milestone",
          title: notification.title,
          description: notification.body || "Keep up the great work!",
          icon: "🔥",
        });
      }
    },
    [celebrate]
  );

  return { handleNotification };
}

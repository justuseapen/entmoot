/* eslint-disable react-refresh/only-export-components */
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";

interface CelebrationData {
  type: "badge" | "streak_milestone";
  title: string;
  description: string;
  icon: string;
}

interface CelebrationContextType {
  celebrate: (data: CelebrationData) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within a CelebrationProvider");
  }
  return context;
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
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
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
  const isBadge = celebration.type === "badge";
  const bgColor = isBadge
    ? "from-purple-500 to-indigo-600"
    : "from-orange-500 to-amber-600";

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

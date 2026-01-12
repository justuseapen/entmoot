import { useState, useEffect, type ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { TipType } from "@/lib/tips";
import { TIP_CONTENT } from "@/lib/tips";
import { useTip } from "@/hooks/useTips";

interface TipTooltipProps {
  tipType: TipType;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  showDelay?: number;
}

export function TipTooltip({
  tipType,
  children,
  side = "top",
  align = "center",
  showDelay = 500,
}: TipTooltipProps) {
  const { shouldShow, dismissTip, isLoading } = useTip(tipType);
  const [open, setOpen] = useState(false);

  const tipContent = TIP_CONTENT[tipType];

  // Show the tip after a delay if it should be shown
  useEffect(() => {
    if (shouldShow && !isLoading) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, showDelay);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, isLoading, showDelay]);

  const handleDismiss = () => {
    setOpen(false);
    dismissTip();
  };

  if (!shouldShow || isLoading) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-72 border-amber-200 bg-amber-50 p-3"
      >
        <div className="flex items-start gap-2">
          {tipContent.icon && (
            <span className="text-lg" role="img" aria-label="tip icon">
              {tipContent.icon}
            </span>
          )}
          <div className="flex-1">
            <p className="font-medium text-amber-900">{tipContent.title}</p>
            <p className="mt-1 text-sm text-amber-800">{tipContent.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 shrink-0 p-0 text-amber-600 hover:bg-amber-100 hover:text-amber-800"
            onClick={handleDismiss}
            aria-label="Dismiss tip"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-amber-700 hover:bg-amber-100"
            onClick={handleDismiss}
          >
            Got it!
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Standalone tip component for more flexible positioning
interface StandaloneTipProps {
  tipType: TipType;
  className?: string;
}

export function StandaloneTip({ tipType, className = "" }: StandaloneTipProps) {
  const { shouldShow, dismissTip, isLoading } = useTip(tipType);
  const [visible, setVisible] = useState(false);

  const tipContent = TIP_CONTENT[tipType];

  // Show the tip after a delay if it should be shown
  useEffect(() => {
    if (shouldShow && !isLoading) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, isLoading]);

  const handleDismiss = () => {
    setVisible(false);
    dismissTip();
  };

  if (!visible || !shouldShow || isLoading) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-3 ${className}`}
    >
      <div className="flex items-start gap-2">
        {tipContent.icon && (
          <span className="text-lg" role="img" aria-label="tip icon">
            {tipContent.icon}
          </span>
        )}
        <div className="flex-1">
          <p className="font-medium text-amber-900">{tipContent.title}</p>
          <p className="mt-1 text-sm text-amber-800">{tipContent.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 shrink-0 p-0 text-amber-600 hover:bg-amber-100 hover:text-amber-800"
          onClick={handleDismiss}
          aria-label="Dismiss tip"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

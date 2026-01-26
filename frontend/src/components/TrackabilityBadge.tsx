import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { StoredTrackabilityAssessment } from "@/lib/goals";

interface TrackabilityBadgeProps {
  trackable: boolean;
  assessment: StoredTrackabilityAssessment | null;
  assessedAt: string | null;
}

export function TrackabilityBadge({
  trackable,
  assessment,
  assessedAt,
}: TrackabilityBadgeProps) {
  // Show "Assessing..." if not yet assessed
  if (!assessedAt) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500">
        Assessing...
      </Badge>
    );
  }

  // Don't show badge for non-trackable goals
  if (!trackable) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge className="cursor-pointer bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
          Auto-Trackable
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">This goal can be auto-tracked</h4>
            {assessment?.reason && (
              <p className="text-muted-foreground mt-1 text-sm">
                {assessment.reason}
              </p>
            )}
          </div>
          {assessment?.potential_integrations &&
            assessment.potential_integrations.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Potential Integrations:
                </p>
                <div className="flex flex-wrap gap-1">
                  {assessment.potential_integrations.map((integration) => (
                    <Badge
                      key={integration}
                      variant="secondary"
                      className="text-xs"
                    >
                      {integration}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

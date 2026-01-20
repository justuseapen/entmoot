import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRecentMentions } from "@/hooks/useMentions";
import {
  formatMentionTime,
  getMentionableTypeLabel,
  type RecentMention,
} from "@/lib/mentions";

export function MentionIndicator() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading } = useRecentMentions();

  const mentions = data?.mentions ?? [];
  const count = data?.count ?? 0;

  const handleMentionClick = (mention: RecentMention) => {
    setOpen(false);
    if (mention.mentionable_link) {
      navigate(mention.mentionable_link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Mentions${count > 0 ? ` (${count} recent)` : ""}`}
        >
          <AtSign className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Recent Mentions</h3>
          <span className="text-xs text-gray-500">Last 7 days</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              Loading...
            </div>
          ) : mentions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <AtSign className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No recent mentions</p>
              <p className="mt-1 text-xs text-gray-400">
                When someone @mentions you, it will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {mentions.map((mention) => (
                <MentionItem
                  key={mention.id}
                  mention={mention}
                  onClick={() => handleMentionClick(mention)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface MentionItemProps {
  mention: RecentMention;
  onClick: () => void;
}

function MentionItem({ mention, onClick }: MentionItemProps) {
  const timeAgo = formatMentionTime(mention.created_at);
  const typeLabel = getMentionableTypeLabel(mention.mentionable_type);

  return (
    <button
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      onClick={onClick}
    >
      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <AtSign className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          <span className="font-semibold">{mention.mentioner.name}</span>{" "}
          mentioned you
        </p>
        <p className="mt-0.5 text-sm text-gray-600">
          in {typeLabel}
          {mention.mentionable_title && (
            <>
              : <span className="font-medium">{mention.mentionable_title}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-400">{timeAgo}</p>
      </div>
    </button>
  );
}

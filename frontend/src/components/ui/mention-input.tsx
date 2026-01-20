"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import type { FamilyMember } from "@/lib/families";

interface MentionInputProps extends Omit<
  React.ComponentProps<"textarea">,
  "onChange"
> {
  /** Whether to use a single-line input or multiline textarea */
  multiline?: boolean;
  /** Called when text value changes */
  onChange?: (value: string) => void;
  /** The current value */
  value?: string;
}

interface MentionState {
  isOpen: boolean;
  query: string;
  startIndex: number;
  selectedIndex: number;
}

export function MentionInput({
  className,
  multiline = true,
  onChange,
  value = "",
  onBlur,
  onKeyDown,
  ...props
}: MentionInputProps) {
  const { members } = useFamilyMembers();
  const [mentionState, setMentionState] = React.useState<MentionState>({
    isOpen: false,
    query: "",
    startIndex: -1,
    selectedIndex: 0,
  });
  const [internalValue, setInternalValue] = React.useState(value);
  const inputRef = React.useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());

  // Sync internal value with external value
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Get the first name from a member's full name
  const getFirstName = (name: string): string => {
    return name.split(" ")[0];
  };

  // Filter members based on query
  const filteredMembers = React.useMemo(() => {
    if (!mentionState.query) return members;
    const lowerQuery = mentionState.query.toLowerCase();
    return members.filter((member) => {
      const firstName = getFirstName(member.name).toLowerCase();
      return firstName.startsWith(lowerQuery);
    });
  }, [members, mentionState.query]);

  // Reset selected index when filtered members change
  React.useEffect(() => {
    setMentionState((prev) => ({
      ...prev,
      selectedIndex: 0,
    }));
  }, [filteredMembers.length]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (mentionState.isOpen && filteredMembers.length > 0) {
      const selectedItem = itemRefs.current.get(mentionState.selectedIndex);
      selectedItem?.scrollIntoView({ block: "nearest" });
    }
  }, [mentionState.selectedIndex, mentionState.isOpen, filteredMembers.length]);

  // Handle text change and detect @ mentions
  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? 0;

    setInternalValue(newValue);
    onChange?.(newValue);

    // Check for @ trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      // Found @ followed by optional word characters
      setMentionState({
        isOpen: true,
        query: atMatch[1] || "",
        startIndex: cursorPos - atMatch[0].length,
        selectedIndex: 0,
      });
    } else {
      // No @ pattern - close dropdown
      setMentionState((prev) => ({
        ...prev,
        isOpen: false,
        query: "",
        startIndex: -1,
      }));
    }
  };

  // Insert a mention
  const insertMention = (member: FamilyMember) => {
    const firstName = getFirstName(member.name);
    const beforeMention = internalValue.slice(0, mentionState.startIndex);
    const afterMention = internalValue.slice(
      mentionState.startIndex + mentionState.query.length + 1 // +1 for @
    );
    const newValue = `${beforeMention}@${firstName}${afterMention}`;

    setInternalValue(newValue);
    onChange?.(newValue);

    // Close dropdown
    setMentionState({
      isOpen: false,
      query: "",
      startIndex: -1,
      selectedIndex: 0,
    });

    // Focus back on input and set cursor position after the inserted mention
    const newCursorPos = mentionState.startIndex + firstName.length + 1; // +1 for @
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (mentionState.isOpen && filteredMembers.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            selectedIndex: Math.min(
              prev.selectedIndex + 1,
              filteredMembers.length - 1
            ),
          }));
          break;
        case "ArrowUp":
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            selectedIndex: Math.max(prev.selectedIndex - 1, 0),
          }));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredMembers[mentionState.selectedIndex]) {
            insertMention(filteredMembers[mentionState.selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            isOpen: false,
          }));
          break;
        case "Tab":
          if (filteredMembers[mentionState.selectedIndex]) {
            e.preventDefault();
            insertMention(filteredMembers[mentionState.selectedIndex]);
          }
          break;
      }
    }
    onKeyDown?.(e as React.KeyboardEvent<HTMLTextAreaElement>);
  };

  // Handle blur - close dropdown after a delay to allow click
  const handleBlur = (
    e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    // Small delay to allow click on dropdown items
    setTimeout(() => {
      if (
        !dropdownRef.current?.contains(document.activeElement) &&
        document.activeElement !== inputRef.current
      ) {
        setMentionState((prev) => ({
          ...prev,
          isOpen: false,
        }));
      }
    }, 150);
    onBlur?.(e as React.FocusEvent<HTMLTextAreaElement>);
  };

  const inputStyles = cn(
    "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    multiline ? "min-h-16 field-sizing-content" : "h-9",
    className
  );

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          data-slot="mention-input"
          className={inputStyles}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          {...(props as React.ComponentProps<"textarea">)}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          data-slot="mention-input"
          className={inputStyles}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          {...(props as React.ComponentProps<"input">)}
        />
      )}

      {/* Dropdown */}
      {mentionState.isOpen && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-50 mt-1 max-h-[200px] overflow-y-auto rounded-md border shadow-md"
        >
          {filteredMembers.map((member, index) => (
            <button
              key={member.user_id}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(index, el);
                } else {
                  itemRefs.current.delete(index);
                }
              }}
              type="button"
              className={cn(
                "hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                index === mentionState.selectedIndex &&
                  "bg-accent text-accent-foreground"
              )}
              onClick={() => insertMention(member)}
              onMouseEnter={() =>
                setMentionState((prev) => ({ ...prev, selectedIndex: index }))
              }
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="flex-1">{member.name}</span>
              <span className="text-muted-foreground text-xs">
                @{getFirstName(member.name)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No matches message */}
      {mentionState.isOpen &&
        mentionState.query &&
        filteredMembers.length === 0 && (
          <div className="bg-popover text-popover-foreground text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border px-3 py-2 text-sm shadow-md">
            No family members found
          </div>
        )}
    </div>
  );
}

// Helper component for displaying text with highlighted mentions (read-only)
interface MentionDisplayProps {
  text: string;
  className?: string;
}

export function MentionDisplay({ text, className }: MentionDisplayProps) {
  const { members } = useFamilyMembers();

  const getFirstName = (name: string): string => {
    return name.split(" ")[0];
  };

  const highlightMentions = (text: string): React.ReactNode => {
    if (!text) return text;

    const parts: React.ReactNode[] = [];
    const regex = /@(\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Check if this is a valid member mention
      const mentionName = match[1].toLowerCase();
      const isMember = members.some(
        (m) => getFirstName(m.name).toLowerCase() === mentionName
      );

      if (isMember) {
        // Highlight the mention
        parts.push(
          <span key={match.index} className="text-primary font-medium">
            {match[0]}
          </span>
        );
      } else {
        // Not a valid member - render as plain text
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return <span className={className}>{highlightMentions(text)}</span>;
}

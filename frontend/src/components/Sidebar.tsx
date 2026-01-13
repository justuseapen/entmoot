import { useState } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFamilyStore } from "@/stores/family";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  tourId?: string;
}

interface ReviewSubItem {
  label: string;
  href: string;
}

// Icon components for navigation items
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface SidebarProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function Sidebar({ collapsed = false, onItemClick }: SidebarProps) {
  const { currentFamily } = useFamilyStore();
  const params = useParams();
  const location = useLocation();
  const [reviewsExpanded, setReviewsExpanded] = useState(() => {
    // Auto-expand if on a review page
    return location.pathname.includes("-review");
  });

  // Get family ID from either params or current family
  const familyId = params.id || currentFamily?.id?.toString();

  // Check if on any review page
  const isOnReviewPage = location.pathname.includes("-review");

  // Build navigation items based on whether family is selected
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <HomeIcon className="h-5 w-5" />,
      tourId: "dashboard",
    },
  ];

  // Family-dependent navigation items (before Reviews)
  const familyNavItems: NavItem[] = [];
  let reviewSubItems: ReviewSubItem[] = [];

  if (familyId) {
    familyNavItems.push(
      {
        label: "Goals",
        href: `/families/${familyId}/goals`,
        icon: <TargetIcon className="h-5 w-5" />,
        tourId: "goals",
      },
      {
        label: "Daily Planner",
        href: `/families/${familyId}/planner`,
        icon: <CalendarIcon className="h-5 w-5" />,
        tourId: "daily-planner",
      }
    );

    reviewSubItems = [
      { label: "Weekly", href: `/families/${familyId}/weekly-review` },
      { label: "Monthly", href: `/families/${familyId}/monthly-review` },
      { label: "Quarterly", href: `/families/${familyId}/quarterly-review` },
    ];
  }

  // Family item (after Reviews)
  const familyItem: NavItem | null = familyId
    ? {
        label: "Family",
        href: `/families/${familyId}`,
        icon: <UsersIcon className="h-5 w-5" />,
        tourId: "family",
      }
    : null;

  // Settings item
  const settingsItem: NavItem = {
    label: "Settings",
    href: "/settings/notifications",
    icon: <SettingsIcon className="h-5 w-5" />,
  };

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.href}
      to={item.href}
      onClick={onItemClick}
      data-tour={item.tourId}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-gray-100",
          isActive
            ? "bg-blue-50 text-blue-600"
            : "text-gray-700 hover:text-gray-900",
          collapsed && "justify-center px-2"
        )
      }
    >
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );

  return (
    <nav className="flex flex-col gap-1 p-2">
      {/* Dashboard */}
      {navItems.map(renderNavItem)}

      {/* Family-dependent items (Goals, Daily Planner) */}
      {familyNavItems.map(renderNavItem)}

      {/* Reviews section with sub-items */}
      {familyId && (
        <div>
          <button
            onClick={() => setReviewsExpanded(!reviewsExpanded)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-gray-100",
              isOnReviewPage
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:text-gray-900",
              collapsed && "justify-center px-2"
            )}
          >
            <ClipboardIcon className="h-5 w-5" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Reviews</span>
                <ChevronDownIcon
                  className={cn(
                    "h-4 w-4 transition-transform",
                    reviewsExpanded && "rotate-180"
                  )}
                />
              </>
            )}
          </button>
          {!collapsed && reviewsExpanded && (
            <div className="mt-1 ml-8 flex flex-col gap-1">
              {reviewSubItems.map((subItem) => (
                <NavLink
                  key={subItem.href}
                  to={subItem.href}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-1.5 text-sm transition-colors",
                      "hover:bg-gray-100",
                      isActive
                        ? "bg-blue-50 font-medium text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    )
                  }
                >
                  {subItem.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family */}
      {familyItem && renderNavItem(familyItem)}

      {/* Settings */}
      {renderNavItem(settingsItem)}
    </nav>
  );
}

// Export icons for reuse
export {
  HomeIcon,
  TargetIcon,
  CalendarIcon,
  ClipboardIcon,
  UsersIcon,
  SettingsIcon,
};

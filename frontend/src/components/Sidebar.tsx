import { NavLink, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFamilyStore } from "@/stores/family";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Icon components for navigation items
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

interface SidebarProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function Sidebar({ collapsed = false, onItemClick }: SidebarProps) {
  const { currentFamily } = useFamilyStore();
  const params = useParams();

  // Get family ID from either params or current family
  const familyId = params.id || currentFamily?.id?.toString();

  // Build navigation items based on whether family is selected
  const navItems: NavItem[] = [];

  if (familyId) {
    navItems.push(
      {
        label: "Focus Card",
        href: `/families/${familyId}/planner`,
        icon: <CalendarIcon className="h-5 w-5" />,
      },
      {
        label: "Family",
        href: `/families/${familyId}`,
        icon: <UsersIcon className="h-5 w-5" />,
      }
    );
  }

  navItems.push({
    label: "Settings",
    href: "/profile",
    icon: <SettingsIcon className="h-5 w-5" />,
  });

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.href}
      to={item.href}
      onClick={onItemClick}
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
    <nav className="flex flex-col gap-1 p-2">{navItems.map(renderNavItem)}</nav>
  );
}

// Export icons for reuse
export { CalendarIcon, UsersIcon, SettingsIcon };

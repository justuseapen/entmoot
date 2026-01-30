import { NavLink, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFamilyStore } from "@/stores/family";
import { CalendarIcon, UsersIcon, SettingsIcon } from "./Sidebar";

export function MobileNav() {
  const { currentFamily } = useFamilyStore();
  const params = useParams();

  // Get family ID from either params or current family
  const familyId = params.id || currentFamily?.id?.toString();

  // Navigation items for bottom nav (limited to 3 for mobile)
  const navItems = [
    {
      label: "Focus",
      href: familyId ? `/families/${familyId}/planner` : "/families",
      icon: <CalendarIcon className="h-5 w-5" />,
    },
    {
      label: "Family",
      href: familyId ? `/families/${familyId}` : "/families",
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <SettingsIcon className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

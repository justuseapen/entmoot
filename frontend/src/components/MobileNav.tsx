import { NavLink, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFamilyStore } from "@/stores/family";
import {
  HomeIcon,
  TargetIcon,
  CalendarIcon,
  ClipboardIcon,
  UsersIcon,
} from "./Sidebar";

export function MobileNav() {
  const { currentFamily } = useFamilyStore();
  const params = useParams();

  // Get family ID from either params or current family
  const familyId = params.id || currentFamily?.id?.toString();

  // Navigation items for bottom nav (limited to 5 for mobile)
  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: <HomeIcon className="h-5 w-5" />,
    },
    {
      label: "Goals",
      href: familyId ? `/families/${familyId}/goals` : "/dashboard",
      disabled: !familyId,
      icon: <TargetIcon className="h-5 w-5" />,
    },
    {
      label: "Plan",
      href: familyId ? `/families/${familyId}/planner` : "/dashboard",
      disabled: !familyId,
      icon: <CalendarIcon className="h-5 w-5" />,
    },
    {
      label: "Review",
      href: familyId ? `/families/${familyId}/weekly-review` : "/dashboard",
      disabled: !familyId,
      icon: <ClipboardIcon className="h-5 w-5" />,
    },
    {
      label: "Family",
      href: familyId ? `/families/${familyId}` : "/families",
      icon: <UsersIcon className="h-5 w-5" />,
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
                item.disabled && "pointer-events-none opacity-50",
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

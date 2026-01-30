import { Link, useLocation } from "react-router-dom";
import { useFamilyStore } from "@/stores/family";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Map routes to their breadcrumb labels
const routeLabels: Record<string, string> = {
  families: "Families",
  planner: "Daily Planner",
  profile: "Profile",
};

function ChevronRight({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function Breadcrumbs() {
  const location = useLocation();
  const { currentFamily } = useFamilyStore();

  // Parse the current path into breadcrumb items
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items from path
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Dashboard for authenticated pages
  if (pathSegments[0] !== "") {
    let currentPath = "";

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;

      // Skip numeric IDs in breadcrumbs, but use family name if available
      if (/^\d+$/.test(segment)) {
        // This is a family ID
        if (pathSegments[i - 1] === "families" && currentFamily) {
          // Replace generic "Families" with family name
          if (breadcrumbs.length > 0) {
            const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
            if (lastBreadcrumb.label === "Families") {
              lastBreadcrumb.label = currentFamily.name;
              lastBreadcrumb.href = `/families/${segment}`;
            }
          }
        }
        continue;
      }

      const label = routeLabels[segment] || segment;
      const isLast = i === pathSegments.length - 1;

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    }
  }

  // Don't show breadcrumbs for single-level pages
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

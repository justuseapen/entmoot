import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth";
import { logout as logoutApi } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { MobileNav } from "./MobileNav";

function MenuIcon({ className }: { className?: string }) {
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
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { user, logout, setLoading, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open HeyDev feedback widget
  const openFeedback = useCallback(() => {
    window.HeyDev?.open();
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + Shift + F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        openFeedback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openFeedback]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch {
      // Even if logout fails on server, clear local state
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-white md:block">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/families" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">Entmoot</span>
          </Link>
        </div>
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4">
          {/* Mobile Menu Button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-4">
                <Link
                  to="/families"
                  className="flex items-center gap-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-xl font-bold text-blue-600">
                    Entmoot
                  </span>
                </Link>
              </div>
              <Sidebar onItemClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Breadcrumbs (desktop only) */}
          <div className="hidden flex-1 md:block">
            <Breadcrumbs />
          </div>

          {/* Mobile: App Name */}
          <div className="flex-1 md:hidden">
            <span className="font-semibold text-gray-900">Entmoot</span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user?.avatar_url || undefined}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openFeedback}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Feedback
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  {isLoading ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="pb-20 md:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* HeyDev feedback widget is loaded via index.html when VITE_HEYDEV_API_KEY is configured */}
    </div>
  );
}

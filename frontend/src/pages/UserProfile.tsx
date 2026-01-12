import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";

export function UserProfile() {
  const { user } = useAuthStore();

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

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user?.avatar_url || undefined}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-blue-100 text-2xl text-blue-600">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{user?.name}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                <p className="text-muted-foreground mt-1 text-xs">
                  Member since {formatDate(user?.created_at)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Profile editing will be available soon. Check back later to update
              your name, avatar, and password.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/settings/notifications">Notification Preferences</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/families">Manage Families</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/points">Points History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

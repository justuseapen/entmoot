import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { logout as logoutApi } from "@/lib/auth";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, token, logout, setLoading, isLoading } = useAuthStore();

  const handleLogout = async () => {
    setLoading(true);
    try {
      if (token) {
        await logoutApi(token);
      }
    } catch {
      // Even if logout fails on server, clear local state
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Signing out..." : "Sign out"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You are signed in as <strong>{user?.email}</strong>.
            </p>
            <p className="text-muted-foreground mt-2">
              This is a protected page. You can only see this if you are
              authenticated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

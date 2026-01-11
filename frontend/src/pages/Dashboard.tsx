import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { useFamilyStore } from "@/stores/family";
import { useFamilies } from "@/hooks/useFamilies";
import { logout as logoutApi } from "@/lib/auth";
import { FamilySwitcher } from "@/components/FamilySwitcher";
import { FamilyCreationWizard } from "@/components/FamilyCreationWizard";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, token, logout, setLoading, isLoading } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  const { data: families, isLoading: familiesLoading } = useFamilies();

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

  const showCreationWizard =
    !familiesLoading && (!families || families.length === 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {!showCreationWizard && <FamilySwitcher />}
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Signing out..." : "Sign out"}
          </Button>
        </div>

        {showCreationWizard ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.name}!</CardTitle>
                <CardDescription>
                  Let&apos;s get started by creating your first family.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A family is your shared planning space. You can invite family
                  members to collaborate on goals, daily planning, and more.
                </p>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <FamilyCreationWizard />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.name}!</CardTitle>
                <CardDescription>
                  You are signed in as <strong>{user?.email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentFamily ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      Currently viewing: <strong>{currentFamily.name}</strong>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Timezone: {currentFamily.timezone}
                    </p>
                  </div>
                ) : families && families.length > 0 ? (
                  <p className="text-muted-foreground">
                    Select a family from the switcher above to get started.
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="flex gap-2">
                {currentFamily && (
                  <Button asChild variant="outline">
                    <Link to={`/families/${currentFamily.id}`}>
                      Family Settings
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/families">Manage Families</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to help you stay organized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {currentFamily ? (
                    <Button asChild variant="outline" className="justify-start">
                      <Link to={`/families/${currentFamily.id}/planner`}>
                        Start Daily Planning
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="justify-start"
                    >
                      Start Daily Planning
                    </Button>
                  )}
                  {currentFamily ? (
                    <Button asChild variant="outline" className="justify-start">
                      <Link to={`/families/${currentFamily.id}/goals`}>
                        Review Goals
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="justify-start"
                    >
                      Review Goals
                    </Button>
                  )}
                  {currentFamily ? (
                    <Button asChild variant="outline" className="justify-start">
                      <Link to={`/families/${currentFamily.id}/reflection`}>
                        Evening Reflection
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="justify-start"
                    >
                      Evening Reflection
                    </Button>
                  )}
                  {currentFamily ? (
                    <Button asChild variant="outline" className="justify-start">
                      <Link to={`/families/${currentFamily.id}/weekly-review`}>
                        Weekly Review
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="justify-start"
                    >
                      Weekly Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

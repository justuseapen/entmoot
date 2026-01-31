import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

export function Home() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold">Welcome to Entmoot</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Your family multi-scale planning platform
      </p>
      {isAuthenticated ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
          <Button asChild>
            <Link to="/families">Go to Focus Card</Link>
          </Button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

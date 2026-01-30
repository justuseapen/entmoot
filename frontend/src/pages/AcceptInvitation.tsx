import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { useFamilyStore } from "@/stores/family";
import {
  acceptInvitation,
  getInvitationDetails,
  roleLabels,
  type MemberRole,
} from "@/lib/families";

interface InvitationInfo {
  email: string;
  family_name: string;
  role: MemberRole;
}

const passwordSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

type PageState =
  | "loading"
  | "not_found"
  | "expired"
  | "already_accepted"
  | "already_member"
  | "success"
  | "requires_login"
  | "requires_signup"
  | "error";

export function AcceptInvitation() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { setCurrentFamily } = useFamilyStore();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(
    null
  );
  const [isExistingUser, setIsExistingUser] = useState(false);

  const signupForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      name: "",
      password: "",
      password_confirmation: "",
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const handleError = useCallback((message: string) => {
    if (message.includes("not found")) {
      setPageState("not_found");
    } else if (message.includes("expired")) {
      setPageState("expired");
    } else if (message.includes("already been accepted")) {
      setPageState("already_accepted");
    } else if (message.includes("already a member")) {
      setPageState("already_member");
    } else {
      setError(message);
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    // Early return if no invite token - but don't set state synchronously
    // The initial "loading" state is fine, we'll handle the redirect after
    if (!inviteToken) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setPageState("not_found"));
      return;
    }

    let cancelled = false;

    async function checkInvitation() {
      try {
        const result = await getInvitationDetails(inviteToken!);

        if (cancelled) return;

        if ("family" in result) {
          // Invitation was accepted successfully
          setCurrentFamily(result.family);
          setPageState("success");
          // Redirect after short delay
          setTimeout(() => navigate("/dashboard"), 2000);
        } else if ("requires_auth" in result && result.requires_auth) {
          // Need to authenticate
          setInvitationInfo(result.invitation);
          // Check if user exists by trying to determine if they need login or signup
          // For now, we'll default to signup and let them switch
          setPageState("requires_signup");
        } else if (result.error) {
          handleError(result.error);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to process invitation";
        handleError(message);
      }
    }

    checkInvitation();

    return () => {
      cancelled = true;
    };
  }, [inviteToken, navigate, setCurrentFamily, handleError]);

  async function onSignupSubmit(data: PasswordFormData) {
    if (!inviteToken) return;
    setError(null);

    try {
      const result = await acceptInvitation({
        inviteToken,
        user: {
          name: data.name,
          password: data.password,
          password_confirmation: data.password_confirmation,
        },
      });
      setCurrentFamily(result.family);
      setPageState("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept invitation";
      setError(message);
    }
  }

  async function onLoginSubmit(data: LoginFormData) {
    if (!inviteToken) return;
    setError(null);

    try {
      const result = await acceptInvitation({
        inviteToken,
        user: {
          password: data.password,
        },
      });
      setCurrentFamily(result.family);
      setPageState("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept invitation";
      setError(message);
    }
  }

  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              Processing invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (pageState === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation has expired. Please ask the family admin to send a
              new invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (pageState === "already_accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Already Used</CardTitle>
            <CardDescription>
              This invitation has already been accepted.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to={isAuthenticated ? "/families" : "/login"}>
                {isAuthenticated ? "Go to Families" : "Sign In"}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (pageState === "already_member") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Already a Member</CardTitle>
            <CardDescription>
              You are already a member of this family.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/families">Go to Families</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to the Family!</CardTitle>
            <CardDescription>
              You have successfully joined the family. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Something Went Wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Signup or login form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invitationInfo?.family_name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as{" "}
            <Badge variant="secondary">
              {invitationInfo ? roleLabels[invitationInfo.role] : "member"}
            </Badge>
          </CardDescription>
        </CardHeader>

        {isExistingUser ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="text-muted-foreground text-sm">
                Sign in to accept the invitation for{" "}
                <strong>{invitationInfo?.email}</strong>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...loginForm.register("password")}
                  aria-invalid={!!loginForm.formState.errors.password}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-destructive text-sm">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting
                  ? "Signing in..."
                  : "Sign In & Join"}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setIsExistingUser(false)}
              >
                Create a new account instead
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="text-muted-foreground text-sm">
                Create an account to accept the invitation for{" "}
                <strong>{invitationInfo?.email}</strong>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  {...signupForm.register("name")}
                  aria-invalid={!!signupForm.formState.errors.name}
                />
                {signupForm.formState.errors.name && (
                  <p className="text-destructive text-sm">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (8+ characters)"
                  {...signupForm.register("password")}
                  aria-invalid={!!signupForm.formState.errors.password}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-destructive text-sm">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  placeholder="Confirm your password"
                  {...signupForm.register("password_confirmation")}
                  aria-invalid={
                    !!signupForm.formState.errors.password_confirmation
                  }
                />
                {signupForm.formState.errors.password_confirmation && (
                  <p className="text-destructive text-sm">
                    {signupForm.formState.errors.password_confirmation.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={signupForm.formState.isSubmitting}
              >
                {signupForm.formState.isSubmitting
                  ? "Creating account..."
                  : "Create Account & Join"}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setIsExistingUser(true)}
              >
                Already have an account? Sign in
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

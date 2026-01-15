import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
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
import { useAuthStore } from "@/stores/auth";
import { register as registerUser } from "@/lib/auth";
import { ApiError, getErrorMessage } from "@/lib/errors";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface ServerError {
  message: string;
  suggestion?: string;
  fieldErrors: Record<string, string>;
}

export function Register() {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState<ServerError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const response = await registerUser(data);
      setAuth(response.user);
      navigate("/", { replace: true });
    } catch (err) {
      const { message, suggestion } = getErrorMessage(err);

      // Extract field-specific errors from ApiError.errors array
      const fieldErrors: Record<string, string> = {};
      if (err instanceof ApiError && err.errors.length > 0) {
        for (const errorMsg of err.errors) {
          // Map backend error messages to form fields
          const lowerError = errorMsg.toLowerCase();
          if (lowerError.includes("email")) {
            fieldErrors.email = errorMsg;
          } else if (
            lowerError.includes("password confirmation") ||
            lowerError.includes("doesn't match")
          ) {
            fieldErrors.password_confirmation = errorMsg;
          } else if (lowerError.includes("password")) {
            fieldErrors.password = errorMsg;
          } else if (lowerError.includes("name")) {
            fieldErrors.name = errorMsg;
          }
        }
      }

      setServerError({ message, suggestion, fieldErrors });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                <p>{serverError.message}</p>
                {serverError.suggestion && (
                  <p className="mt-1">
                    {serverError.suggestion}{" "}
                    {serverError.suggestion.toLowerCase().includes("sign") && (
                      <Link
                        to="/login"
                        className="font-medium underline underline-offset-4 hover:opacity-80"
                      >
                        Sign in
                      </Link>
                    )}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                {...register("name")}
                aria-invalid={!!errors.name || !!serverError?.fieldErrors.name}
              />
              {(errors.name || serverError?.fieldErrors.name) && (
                <p className="text-destructive text-sm">
                  {errors.name?.message || serverError?.fieldErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
                aria-invalid={
                  !!errors.email || !!serverError?.fieldErrors.email
                }
              />
              {(errors.email || serverError?.fieldErrors.email) && (
                <p className="text-destructive text-sm">
                  {errors.email?.message || serverError?.fieldErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                {...register("password")}
                aria-invalid={
                  !!errors.password || !!serverError?.fieldErrors.password
                }
              />
              {(errors.password || serverError?.fieldErrors.password) && (
                <p className="text-destructive text-sm">
                  {errors.password?.message ||
                    serverError?.fieldErrors.password}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                {...register("password_confirmation")}
                aria-invalid={
                  !!errors.password_confirmation ||
                  !!serverError?.fieldErrors.password_confirmation
                }
              />
              {(errors.password_confirmation ||
                serverError?.fieldErrors.password_confirmation) && (
                <p className="text-destructive text-sm">
                  {errors.password_confirmation?.message ||
                    serverError?.fieldErrors.password_confirmation}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

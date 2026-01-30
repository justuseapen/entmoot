import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth";
import {
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
  useExportUserDataMutation,
} from "@/hooks/useProfile";
import { downloadJson } from "@/lib/profile";

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatar_url: z.string().url("Must be a valid URL").or(z.literal("")),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z
      .string()
      .min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z
    .string()
    .refine((val) => val === "DELETE", { message: "Type DELETE to confirm" }),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
interface DeleteAccountFormData {
  password: string;
  confirmation: string;
}

export function UserProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const exportData = useExportUserDataMutation();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      avatar_url: user?.avatar_url || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  // Delete account form
  const deleteForm = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
      confirmation: "",
    },
  });

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

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        name: data.name,
        avatar_url: data.avatar_url || undefined,
      });
      setIsEditingProfile(false);
      showSuccessMessage("Profile updated successfully");
    } catch {
      // Error is handled by the mutation
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data);
      setIsChangingPassword(false);
      passwordForm.reset();
      showSuccessMessage("Password changed successfully");
    } catch {
      // Error is handled by the mutation
    }
  };

  // Handle account deletion
  const onDeleteSubmit = async (data: DeleteAccountFormData) => {
    try {
      await deleteAccount.mutateAsync({ password: data.password });
      navigate("/login");
    } catch {
      // Error is handled by the mutation
    }
  };

  // Handle data export
  const handleExportData = async () => {
    try {
      const data = await exportData.mutateAsync();
      const filename = `entmoot-export-${new Date().toISOString().split("T")[0]}.json`;
      downloadJson(data, filename);
      showSuccessMessage("Data exported successfully");
    } catch {
      // Error is handled by the mutation
    }
  };

  // Show success message temporarily
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Cancel editing
  const cancelProfileEdit = () => {
    profileForm.reset({
      name: user?.name || "",
      avatar_url: user?.avatar_url || "",
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="p-4 pb-20 md:p-6 md:pb-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
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
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>

          {isEditingProfile && (
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...profileForm.register("name")} />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    placeholder="https://example.com/avatar.jpg"
                    {...profileForm.register("avatar_url")}
                  />
                  {profileForm.formState.errors.avatar_url && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.avatar_url.message}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Enter a URL to an image for your profile picture
                  </p>
                </div>

                {updateProfile.error && (
                  <p className="text-sm text-red-500">
                    {(updateProfile.error as Error).message ||
                      "Failed to update profile"}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelProfileEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </div>
              {!isChangingPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change Password
                </Button>
              )}
            </div>
          </CardHeader>

          {isChangingPassword && (
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    {...passwordForm.register("current_password")}
                  />
                  {passwordForm.formState.errors.current_password && (
                    <p className="text-sm text-red-500">
                      {passwordForm.formState.errors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...passwordForm.register("password")}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">
                    Confirm New Password
                  </Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    {...passwordForm.register("password_confirmation")}
                  />
                  {passwordForm.formState.errors.password_confirmation && (
                    <p className="text-sm text-red-500">
                      {
                        passwordForm.formState.errors.password_confirmation
                          .message
                      }
                    </p>
                  )}
                </div>

                {changePassword.error && (
                  <p className="text-sm text-red-500">
                    {(changePassword.error as Error).message ||
                      "Failed to change password"}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={changePassword.isPending}>
                    {changePassword.isPending
                      ? "Updating..."
                      : "Update Password"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      passwordForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
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

        {/* Connected Calendars (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Calendars</CardTitle>
            <CardDescription>
              Sync your goals and tasks with external calendars
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div>
                <p className="font-medium">Coming Soon</p>
                <p className="text-muted-foreground text-sm">
                  Calendar integration will be available in a future update
                </p>
              </div>
              <Button variant="outline" disabled>
                Connect Calendar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data & Privacy</CardTitle>
            <CardDescription>Manage your data and account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Your Data</p>
                <p className="text-muted-foreground text-sm">
                  Download all your data in JSON format
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={exportData.isPending}
              >
                {exportData.isPending ? "Exporting..." : "Export Data"}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-muted-foreground text-sm">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delete_password">
                  Enter your password to confirm
                </Label>
                <Input
                  id="delete_password"
                  type="password"
                  {...deleteForm.register("password")}
                />
                {deleteForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {deleteForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <span className="font-mono font-bold">DELETE</span> to
                  confirm
                </Label>
                <Input
                  id="confirmation"
                  placeholder="DELETE"
                  {...deleteForm.register("confirmation")}
                />
                {deleteForm.formState.errors.confirmation && (
                  <p className="text-sm text-red-500">
                    {deleteForm.formState.errors.confirmation.message}
                  </p>
                )}
              </div>

              {deleteAccount.error && (
                <p className="text-sm text-red-500">
                  {(deleteAccount.error as Error).message ||
                    "Failed to delete account"}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  deleteForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending
                  ? "Deleting..."
                  : "Permanently Delete Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

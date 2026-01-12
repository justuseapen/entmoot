import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useFamily,
  useUpdateFamily,
  useDeleteFamily,
} from "@/hooks/useFamilies";
import { useAuthStore } from "@/stores/auth";
import { useFamilyStore } from "@/stores/family";
import { MembersList } from "@/components/MembersList";
import { PendingInvitations } from "@/components/PendingInvitations";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import { PetsList } from "@/components/PetsList";
import { StandaloneTip } from "@/components/TipTooltip";
import { EmptyState } from "@/components/EmptyState";
import type { MemberRole } from "@/lib/families";

const familySettingsSchema = z.object({
  name: z.string().min(1, "Family name is required").max(100, "Name too long"),
  timezone: z.string().min(1, "Timezone is required"),
});

type FamilySettingsData = z.infer<typeof familySettingsSchema>;

const commonTimezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

export function FamilySettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const familyId = parseInt(id!, 10);
  const { user } = useAuthStore();
  const { setCurrentFamily, clearFamily } = useFamilyStore();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: family, isLoading, error: loadError } = useFamily(familyId);
  const updateFamily = useUpdateFamily(familyId);
  const deleteFamily = useDeleteFamily(familyId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FamilySettingsData>({
    resolver: zodResolver(familySettingsSchema),
    values: family
      ? { name: family.name, timezone: family.timezone }
      : undefined,
  });

  const selectedTimezone = watch("timezone");

  // Get current user's role in this family
  const currentMember = family?.members.find((m) => m.user_id === user?.id);
  const currentUserRole: MemberRole = currentMember?.role || "observer";
  const isAdmin = currentUserRole === "admin";
  const canInvite = currentUserRole === "admin" || currentUserRole === "adult";

  const onSubmit = async (data: FamilySettingsData) => {
    setError(null);
    setSuccess(null);
    try {
      const result = await updateFamily.mutateAsync(data);
      setCurrentFamily(result.family);
      setSuccess("Family settings updated successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update family settings"
      );
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteFamily.mutateAsync();
      clearFamily();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete family");
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-muted-foreground">Loading family settings...</p>
        </div>
      </div>
    );
  }

  if (loadError || !family) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {loadError instanceof Error
                  ? loadError.message
                  : "Failed to load family"}
              </p>
              <Button asChild className="mt-4">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{family.name}</h1>
            <p className="text-muted-foreground">Family settings and members</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/families/${familyId}/goals`}>View Goals</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/families/${familyId}/leaderboard`}>Leaderboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Family Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Family Settings</CardTitle>
              <CardDescription>
                Update your family&apos;s name and timezone
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
                    {success}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Family Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    disabled={!isAdmin}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={selectedTimezone}
                    onValueChange={(value) =>
                      setValue("timezone", value, { shouldDirty: true })
                    }
                    disabled={!isAdmin}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonTimezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.timezone && (
                    <p className="text-destructive text-sm">
                      {errors.timezone.message}
                    </p>
                  )}
                </div>
              </CardContent>
              {isAdmin && (
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting || !isDirty}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>

          {/* Tip for when family has more than one member */}
          {family.members.length > 1 && (
            <StandaloneTip tipType="first_family_member" />
          )}

          {/* Encourage inviting members if family only has one member */}
          {family.members.length === 1 && canInvite && (
            <EmptyState
              variant="family_members"
              onAction={() => setShowInviteModal(true)}
            />
          )}

          {/* Members List */}
          <MembersList
            familyId={familyId}
            members={family.members}
            currentUserRole={currentUserRole}
          />

          {/* Pets List */}
          <PetsList familyId={familyId} currentUserRole={currentUserRole} />

          {/* Invite Button */}
          {canInvite && (
            <div className="flex justify-center">
              <Button onClick={() => setShowInviteModal(true)}>
                Invite New Member
              </Button>
            </div>
          )}

          {/* Pending Invitations */}
          {canInvite && <PendingInvitations familyId={familyId} />}

          {/* Danger Zone */}
          {isAdmin && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive text-lg">
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions for this family
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Family</p>
                    <p className="text-muted-foreground text-sm">
                      Permanently delete this family and all its data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Family
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        familyId={familyId}
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Family</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{family.name}&quot;? This
              will permanently remove all family data, goals, and member
              associations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteFamily.isPending}
            >
              {deleteFamily.isPending ? "Deleting..." : "Delete Family"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

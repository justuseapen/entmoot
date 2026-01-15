import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSendInvitation } from "@/hooks/useFamilies";
import {
  roleLabels,
  roleDescriptions,
  type MemberRole,
  type Invitation,
} from "@/lib/families";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["observer", "child", "teen", "adult", "admin"] as const),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const availableRoles: MemberRole[] = [
  "admin",
  "adult",
  "teen",
  "child",
  "observer",
];

interface InviteMemberModalProps {
  familyId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  familyId,
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [sentInvitation, setSentInvitation] = useState<Invitation | null>(null);
  const sendInvitation = useSendInvitation(familyId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "adult",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: InviteFormData) => {
    setError(null);
    try {
      const result = await sendInvitation.mutateAsync(data);
      setSentInvitation(result.invitation);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setError(null);
      setSentInvitation(null);
    }
    onOpenChange(newOpen);
  };

  const handleSendAnother = () => {
    reset();
    setSentInvitation(null);
  };

  const formatExpirationDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (sentInvitation) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Invitation Sent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="space-y-1">
                  <p className="font-medium">{sentInvitation.email}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {roleLabels[sentInvitation.role]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700"
                    >
                      Pending
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Expires {formatExpirationDate(sentInvitation.expires_at)}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              An email has been sent with instructions to join your family. You
              can track this invitation in the Pending Invitations section.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSendAnother}>
              Send Another
            </Button>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Family Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add someone to your family. They&apos;ll
            receive an email with instructions to join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="family.member@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue("role", value as MemberRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {roleDescriptions[selectedRole]}
              </p>
              {errors.role && (
                <p className="text-destructive text-sm">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

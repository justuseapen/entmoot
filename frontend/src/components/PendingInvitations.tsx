import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useInvitations,
  useResendInvitation,
  useCancelInvitation,
} from "@/hooks/useFamilies";
import { roleLabels, type Invitation } from "@/lib/families";

interface PendingInvitationsProps {
  familyId: number;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function InvitationRow({
  invitation,
  familyId,
}: {
  invitation: Invitation;
  familyId: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const resendInvitation = useResendInvitation(familyId);
  const cancelInvitation = useCancelInvitation(familyId);
  const expired = isExpired(invitation.expires_at);

  const handleResend = async () => {
    setError(null);
    try {
      await resendInvitation.mutateAsync(invitation.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend invitation"
      );
    }
  };

  const handleCancel = async () => {
    setError(null);
    try {
      await cancelInvitation.mutateAsync(invitation.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel invitation"
      );
    }
  };

  return (
    <div className="flex items-center justify-between border-b py-3 last:border-b-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{invitation.email}</span>
          <Badge variant={expired ? "destructive" : "secondary"}>
            {roleLabels[invitation.role]}
          </Badge>
          {expired && (
            <Badge variant="outline" className="text-destructive">
              Expired
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          Invited by {invitation.inviter.name} on{" "}
          {formatDate(invitation.created_at)}
          {!expired && ` · Expires ${formatDate(invitation.expires_at)}`}
        </p>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resendInvitation.isPending}
        >
          {resendInvitation.isPending ? "Resending..." : "Resend"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={cancelInvitation.isPending}
          className="text-destructive hover:text-destructive"
        >
          {cancelInvitation.isPending ? "Cancelling..." : "Cancel"}
        </Button>
      </div>
    </div>
  );
}

export function PendingInvitations({ familyId }: PendingInvitationsProps) {
  const { data: invitations, isLoading, error } = useInvitations(familyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading invitations...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load invitations</p>
        </CardContent>
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pending Invitations</CardTitle>
        <CardDescription>
          {invitations.length} invitation{invitations.length !== 1 ? "s" : ""}{" "}
          waiting for response
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {invitations.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              familyId={familyId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

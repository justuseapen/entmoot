import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateMemberRole, useRemoveMember } from "@/hooks/useFamilies";
import { useAuthStore } from "@/stores/auth";
import { roleLabels, type FamilyMember, type MemberRole } from "@/lib/families";

interface MembersListProps {
  familyId: number;
  members: FamilyMember[];
  currentUserRole: MemberRole;
}

const availableRoles: MemberRole[] = [
  "admin",
  "adult",
  "teen",
  "child",
  "observer",
];

const roleBadgeVariant: Record<
  MemberRole,
  "default" | "secondary" | "outline" | "destructive"
> = {
  admin: "default",
  adult: "secondary",
  teen: "secondary",
  child: "outline",
  observer: "outline",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface MemberRowProps {
  member: FamilyMember;
  familyId: number;
  canManage: boolean;
  isCurrentUser: boolean;
  isLastAdmin: boolean;
}

function MemberRow({
  member,
  familyId,
  canManage,
  isCurrentUser,
  isLastAdmin,
}: MemberRowProps) {
  const [error, setError] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const updateRole = useUpdateMemberRole(familyId);
  const removeMember = useRemoveMember(familyId);

  const handleRoleChange = async (newRole: MemberRole) => {
    setError(null);
    try {
      await updateRole.mutateAsync({ membershipId: member.id, role: newRole });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      await removeMember.mutateAsync(member.id);
      setShowRemoveDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const canChangeRole = canManage && !isCurrentUser && !isLastAdmin;
  const canRemove = canManage && !isCurrentUser && !isLastAdmin;

  return (
    <>
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={member.avatar_url || undefined}
              alt={member.name}
            />
            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{member.name}</span>
              {isCurrentUser && (
                <span className="text-muted-foreground text-xs">(You)</span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{member.email}</p>
            <p className="text-muted-foreground text-xs">
              Joined {formatDate(member.joined_at)}
            </p>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canChangeRole ? (
            <Select
              value={member.role}
              onValueChange={(value) => handleRoleChange(value as MemberRole)}
              disabled={updateRole.isPending}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={roleBadgeVariant[member.role]}>
              {roleLabels[member.role]}
            </Badge>
          )}
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRemoveDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Family Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {member.name} from this family?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MembersList({
  familyId,
  members,
  currentUserRole,
}: MembersListProps) {
  const { user } = useAuthStore();
  const isAdmin = currentUserRole === "admin";
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Family Members</CardTitle>
        <CardDescription>
          {members.length} member{members.length !== 1 ? "s" : ""} in this
          family
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              familyId={familyId}
              canManage={isAdmin}
              isCurrentUser={member.user_id === user?.id}
              isLastAdmin={member.role === "admin" && adminCount === 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

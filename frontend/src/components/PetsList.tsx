import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { usePets, useDeletePet } from "@/hooks/usePets";
import { type Pet } from "@/lib/pets";
import { type MemberRole } from "@/lib/families";
import { PetCard } from "@/components/PetCard";
import { PetModal } from "@/components/PetModal";

interface PetsListProps {
  familyId: number;
  currentUserRole: MemberRole;
}

export function PetsList({ familyId, currentUserRole }: PetsListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: pets, isLoading, error } = usePets(familyId);
  const deletePet = useDeletePet(familyId);

  const canManagePets =
    currentUserRole === "admin" || currentUserRole === "adult";

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
  };

  const handleDelete = (pet: Pet) => {
    setDeleteError(null);
    setDeletingPet(pet);
  };

  const confirmDelete = async () => {
    if (!deletingPet) return;

    setDeleteError(null);
    try {
      await deletePet.mutateAsync(deletingPet.id);
      setDeletingPet(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete pet"
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pets</CardTitle>
          <CardDescription>Loading pets...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pets</CardTitle>
          <CardDescription className="text-destructive">
            {error instanceof Error ? error.message : "Failed to load pets"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pets</CardTitle>
              <CardDescription>
                Your family&apos;s furry, feathered, or scaly companions
              </CardDescription>
            </div>
            {canManagePets && (
              <Button onClick={() => setShowAddModal(true)}>Add Pet</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pets && pets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  canManage={canManagePets}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-4xl">🐾</p>
              <p className="text-muted-foreground mt-2">
                No pets yet. {canManagePets && "Add your first pet!"}
              </p>
              {canManagePets && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setShowAddModal(true)}
                >
                  Add Your First Pet
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Pet Modal */}
      <PetModal
        familyId={familyId}
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />

      {/* Edit Pet Modal */}
      <PetModal
        familyId={familyId}
        pet={editingPet}
        open={!!editingPet}
        onOpenChange={(open) => {
          if (!open) setEditingPet(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingPet}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPet(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pet</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deletingPet?.name} from your
              family? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingPet(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePet.isPending}
            >
              {deletePet.isPending ? "Deleting..." : "Delete Pet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

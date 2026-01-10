import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCreatePet, useUpdatePet } from "@/hooks/usePets";
import { type Pet, commonPetTypes } from "@/lib/pets";

const petSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(100, "Name too long"),
  pet_type: z.string().optional(),
  avatar_url: z
    .union([z.string().url("Invalid URL"), z.literal("")])
    .optional(),
  birthday: z.string().optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

type PetFormData = z.infer<typeof petSchema>;

interface PetModalProps {
  familyId: number;
  pet?: Pet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PetModal({ familyId, pet, open, onOpenChange }: PetModalProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!pet;

  const createPet = useCreatePet(familyId);
  const updatePet = useUpdatePet(familyId, pet?.id ?? 0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      pet_type: "",
      avatar_url: "",
      birthday: "",
      notes: "",
    },
  });

  const selectedPetType = watch("pet_type");

  // Reset form when modal opens/closes or pet changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (pet) {
        reset({
          name: pet.name,
          pet_type: pet.pet_type || "",
          avatar_url: pet.avatar_url || "",
          birthday: pet.birthday || "",
          notes: pet.notes || "",
        });
      } else {
        reset({
          name: "",
          pet_type: "",
          avatar_url: "",
          birthday: "",
          notes: "",
        });
      }
    }
  }, [open, pet, reset]);

  const onSubmit = async (data: PetFormData) => {
    setError(null);
    try {
      const petData = {
        name: data.name,
        pet_type: data.pet_type || undefined,
        avatar_url: data.avatar_url || undefined,
        birthday: data.birthday || undefined,
        notes: data.notes || undefined,
      };

      if (isEditing) {
        await updatePet.mutateAsync(petData);
      } else {
        await createPet.mutateAsync(petData);
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? "update" : "add"} pet`
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Pet" : "Add New Pet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your pet's information."
              : "Add a new furry (or scaly, or feathery) friend to your family."}
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Buddy"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pet_type">Type</Label>
              <Select
                value={selectedPetType}
                onValueChange={(value) => setValue("pet_type", value)}
              >
                <SelectTrigger id="pet_type">
                  <SelectValue placeholder="Select pet type" />
                </SelectTrigger>
                <SelectContent>
                  {commonPetTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Photo URL</Label>
              <Input
                id="avatar_url"
                type="url"
                placeholder="https://example.com/photo.jpg"
                {...register("avatar_url")}
                aria-invalid={!!errors.avatar_url}
              />
              {errors.avatar_url && (
                <p className="text-destructive text-sm">
                  {errors.avatar_url.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Optional: Add a URL to your pet&apos;s photo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input id="birthday" type="date" {...register("birthday")} />
              <p className="text-muted-foreground text-xs">
                Optional: Track your pet&apos;s age
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Favorite treats, medical info, etc."
                {...register("notes")}
                aria-invalid={!!errors.notes}
              />
              {errors.notes && (
                <p className="text-destructive text-sm">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                  ? "Save Changes"
                  : "Add Pet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

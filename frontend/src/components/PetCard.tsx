import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Pet, getPetEmoji } from "@/lib/pets";

interface PetCardProps {
  pet: Pet;
  canManage: boolean;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
}

function formatBirthday(birthday: string | null): string | null {
  if (!birthday) return null;
  const date = new Date(birthday);
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function calculateAge(birthday: string | null): string | null {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    years--;
  }

  if (years < 1) {
    // Calculate months for young pets
    let months =
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
      today.getMonth() -
      birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    if (months <= 0) {
      return "Newborn";
    }
    return `${months} month${months === 1 ? "" : "s"} old`;
  }

  return `${years} year${years === 1 ? "" : "s"} old`;
}

export function PetCard({ pet, canManage, onEdit, onDelete }: PetCardProps) {
  const emoji = getPetEmoji(pet.pet_type);
  const formattedBirthday = formatBirthday(pet.birthday);
  const age = calculateAge(pet.birthday);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {pet.avatar_url ? (
              <AvatarImage src={pet.avatar_url} alt={pet.name} />
            ) : null}
            <AvatarFallback className="text-3xl">{emoji}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{pet.name}</CardTitle>
            {pet.pet_type && (
              <CardDescription className="capitalize">
                {pet.pet_type}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-2 text-sm">
          {formattedBirthday && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">Birthday:</span>{" "}
              {formattedBirthday}
              {age && ` (${age})`}
            </p>
          )}
          {pet.notes && (
            <p className="text-muted-foreground line-clamp-2">{pet.notes}</p>
          )}
        </div>
        {canManage && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(pet)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground flex-1"
              onClick={() => onDelete(pet)}
            >
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

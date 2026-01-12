import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFamilies } from "@/hooks/useFamilies";
import { useFamilyStore } from "@/stores/family";
import { FamilyCreationWizard } from "@/components/FamilyCreationWizard";
import type { Family } from "@/lib/families";

function FamilyCard({ family }: { family: Family }) {
  const navigate = useNavigate();
  const { currentFamily, setCurrentFamily } = useFamilyStore();
  const isCurrentFamily = currentFamily?.id === family.id;

  const handleSelect = () => {
    setCurrentFamily(family);
    navigate("/dashboard");
  };

  return (
    <Card className={isCurrentFamily ? "ring-primary ring-2" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{family.name}</CardTitle>
          {isCurrentFamily && <Badge>Current</Badge>}
        </div>
        <CardDescription>{family.timezone}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Created{" "}
          {new Date(family.created_at).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/families/${family.id}`}>Settings</Link>
        </Button>
        {!isCurrentFamily && (
          <Button size="sm" onClick={handleSelect}>
            Select
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function Families() {
  const { data: families, isLoading, error } = useFamilies();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  const handleFamilyCreated = () => {
    setShowCreateDialog(false);
    // Navigate to the newly created family (the hook handles setting it as current)
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-muted-foreground">Loading families...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load families"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No families - show creation wizard inline
  if (!families || families.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome to Entmoot</h1>
            <p className="text-muted-foreground mt-2">
              Create your first family to get started with family planning.
            </p>
          </div>
          <div className="flex justify-center">
            <FamilyCreationWizard onComplete={handleFamilyCreated} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Families</h1>
            <p className="text-muted-foreground">
              Manage your families and memberships
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Family
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>
      </div>

      {/* Create Family Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Family</DialogTitle>
          </DialogHeader>
          <FamilyCreationWizard onComplete={handleFamilyCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

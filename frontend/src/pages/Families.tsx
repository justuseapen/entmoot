import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamilies } from "@/hooks/useFamilies";
import { useFamilyStore } from "@/stores/family";
import { FamilyCreationWizard } from "@/components/FamilyCreationWizard";

export function Families() {
  const { data: families, isLoading, error } = useFamilies();
  const { setCurrentFamily } = useFamilyStore();
  const navigate = useNavigate();

  // If user has a family, redirect to the Focus Card
  useEffect(() => {
    if (!isLoading && families && families.length > 0) {
      setCurrentFamily(families[0]);
      navigate(`/families/${families[0].id}/planner`, { replace: true });
    }
  }, [families, isLoading, navigate, setCurrentFamily]);

  const handleFamilyCreated = () => {
    navigate("/families");
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-muted-foreground">Loading...</p>
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

  // No families - show creation wizard
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome to Entmoot</h1>
          <p className="text-muted-foreground mt-2">
            Create your family to get started with family planning.
          </p>
        </div>
        <div className="flex justify-center">
          <FamilyCreationWizard onComplete={handleFamilyCreated} />
        </div>
      </div>
    </div>
  );
}

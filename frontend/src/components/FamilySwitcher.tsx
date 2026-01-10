import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFamilies } from "@/hooks/useFamilies";
import { useFamilyStore } from "@/stores/family";
import type { Family } from "@/lib/families";

interface FamilySwitcherProps {
  className?: string;
}

export function FamilySwitcher({ className }: FamilySwitcherProps) {
  const navigate = useNavigate();
  const { data: families, isLoading } = useFamilies();
  const { currentFamily, setCurrentFamily } = useFamilyStore();

  const handleFamilyChange = (familyId: string) => {
    if (familyId === "manage") {
      navigate("/families");
      return;
    }
    const selected = families?.find((f) => f.id === parseInt(familyId, 10));
    if (selected) {
      setCurrentFamily(selected);
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Button variant="outline" size="sm" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  if (!families || families.length === 0) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/families")}
        >
          Create Family
        </Button>
      </div>
    );
  }

  // If only one family, show it as a button
  if (families.length === 1) {
    const family = families[0];
    return (
      <div className={className}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/families/${family.id}`)}
        >
          {family.name}
        </Button>
      </div>
    );
  }

  // Multiple families - show switcher
  return (
    <div className={className}>
      <Select
        value={currentFamily?.id?.toString() || families[0].id.toString()}
        onValueChange={handleFamilyChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select family" />
        </SelectTrigger>
        <SelectContent>
          {families.map((family: Family) => (
            <SelectItem key={family.id} value={family.id.toString()}>
              {family.name}
            </SelectItem>
          ))}
          <SelectItem value="manage">Manage Families...</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

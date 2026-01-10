import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useCreateFamily } from "@/hooks/useFamilies";
import { useFamilyStore } from "@/stores/family";
import { getBrowserTimezone } from "@/lib/families";

const familySchema = z.object({
  name: z.string().min(1, "Family name is required").max(100, "Name too long"),
  timezone: z.string().min(1, "Timezone is required"),
});

type FamilyFormData = z.infer<typeof familySchema>;

// Common timezones for selection
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

interface FamilyCreationWizardProps {
  onComplete?: () => void;
}

export function FamilyCreationWizard({
  onComplete,
}: FamilyCreationWizardProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const createFamily = useCreateFamily();
  const setCurrentFamily = useFamilyStore((state) => state.setCurrentFamily);

  const browserTimezone = getBrowserTimezone();
  const defaultTimezone = commonTimezones.find(
    (tz) => tz.value === browserTimezone
  )
    ? browserTimezone
    : "America/New_York";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: "",
      timezone: defaultTimezone,
    },
  });

  const selectedTimezone = watch("timezone");

  const onSubmit = async (data: FamilyFormData) => {
    setError(null);
    try {
      const result = await createFamily.mutateAsync(data);
      setCurrentFamily(result.family);
      if (onComplete) {
        onComplete();
      } else {
        navigate(`/families/${result.family.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create family");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Your Family</CardTitle>
        <CardDescription>
          Set up your family hub to start planning together.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Family Name</Label>
            <Input
              id="name"
              placeholder="The Smith Family"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={selectedTimezone}
              onValueChange={(value) => setValue("timezone", value)}
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
            <p className="text-muted-foreground text-xs">
              Your browser timezone: {browserTimezone}
            </p>
            {errors.timezone && (
              <p className="text-destructive text-sm">
                {errors.timezone.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Family"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

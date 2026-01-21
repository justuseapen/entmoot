import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TreeAnimation } from "../TreeAnimation";
import { OnboardingStep } from "../OnboardingStep";
import { OnboardingProgress } from "../OnboardingProgress";
import { useAuthStore } from "@/stores/auth";
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
  { value: "America/New_York", label: "Eastern Time (ET) - New York" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
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

interface FamilyBasicsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function FamilyBasicsStep({ onNext, onBack }: FamilyBasicsStepProps) {
  const { user } = useAuthStore();
  const createFamily = useCreateFamily();
  const setCurrentFamily = useFamilyStore((state) => state.setCurrentFamily);
  const [error, setError] = useState<string | null>(null);

  const browserTimezone = getBrowserTimezone();
  const defaultTimezone = commonTimezones.find(
    (tz) => tz.value === browserTimezone
  )
    ? browserTimezone
    : "America/New_York";

  // Auto-fill family name from user's last name
  const defaultFamilyName = user?.name
    ? `The ${user.name.split(" ").pop()} Family`
    : "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: defaultFamilyName,
      timezone: defaultTimezone,
    },
  });

  const selectedTimezone = watch("timezone");

  // Set default timezone on mount
  useEffect(() => {
    if (defaultTimezone) {
      setValue("timezone", defaultTimezone);
    }
  }, [defaultTimezone, setValue]);

  const onSubmit = async (data: FamilyFormData) => {
    setError(null);
    try {
      const result = await createFamily.mutateAsync(data);
      setCurrentFamily(result.family);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create family");
    }
  };

  return (
    <OnboardingStep>
      <div className="mx-auto flex max-w-lg flex-col px-4 py-6">
        {/* Progress bar */}
        <OnboardingProgress currentStep="family_basics" className="mb-8" />

        <div className="flex flex-col items-center">
          {/* Tree animation - stage 2 */}
          <div className="mb-6 h-28 w-28">
            <TreeAnimation stage={2} />
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Let&apos;s create your family hub
          </h1>

          <p className="mb-6 text-center text-gray-600">
            This is where your family will plan and grow together.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Family Name</Label>
              <Input
                id="name"
                placeholder="The Johnson Family"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Auto-filled from your registration
              </p>
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
              <p className="text-xs text-gray-500">
                Auto-detected from your browser: {browserTimezone}
              </p>
              {errors.timezone && (
                <p className="text-sm text-red-500">
                  {errors.timezone.message}
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                ← Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Creating..." : "Create Family →"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingStep>
  );
}

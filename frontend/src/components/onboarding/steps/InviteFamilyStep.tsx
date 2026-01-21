import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Send, Users } from "lucide-react";
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
import { useFamilyStore } from "@/stores/family";
import { useSendInvitation } from "@/hooks/useFamilies";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/useScrollAnimation";

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Full control over family settings",
  },
  {
    value: "adult",
    label: "Adult",
    description: "Create goals, assign tasks",
  },
  {
    value: "teen",
    label: "Teen",
    description: "Track own goals, complete tasks",
  },
  {
    value: "child",
    label: "Child",
    description: "Simplified view, earn rewards",
  },
] as const;

const inviteSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email("Please enter a valid email"),
      role: z.enum(["admin", "adult", "teen", "child"]),
    })
  ),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteFamilyStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function InviteFamilyStep({
  onNext,
  onBack,
  onSkip,
}: InviteFamilyStepProps) {
  const currentFamily = useFamilyStore((state) => state.currentFamily);
  const familyId = currentFamily?.id;
  const sendInvitation = useSendInvitation(familyId || 0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSentAnimation, setShowSentAnimation] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      invites: [{ email: "", role: "adult" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invites",
  });

  const watchedInvites = watch("invites");

  const handleAddAnother = () => {
    append({ email: "", role: "adult" });
  };

  const onSubmit = async (data: InviteFormData) => {
    if (!familyId) return;

    setError(null);
    let successCount = 0;

    // Filter out empty emails
    const validInvites = data.invites.filter((invite) => invite.email.trim());

    if (validInvites.length === 0) {
      onNext();
      return;
    }

    // Send invitations one by one
    for (const invite of validInvites) {
      try {
        await sendInvitation.mutateAsync({
          email: invite.email,
          role: invite.role,
        });
        successCount++;
      } catch {
        // Continue with other invites even if one fails
      }
    }

    if (successCount > 0) {
      setSentCount(successCount);
      setShowSentAnimation(true);

      // Wait for animation then proceed
      setTimeout(() => {
        onNext();
      }, 1500);
    } else {
      setError("Failed to send invitations. Please try again.");
    }
  };

  return (
    <OnboardingStep>
      <div className="mx-auto flex max-w-lg flex-col px-4 py-6">
        {/* Progress bar */}
        <OnboardingProgress currentStep="invite" className="mb-8" />

        <div className="flex flex-col items-center">
          {/* Tree animation - stage 5 */}
          <div className="mb-6 h-28 w-28">
            <TreeAnimation stage={5} />
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Bring your family together
          </h1>

          <p className="mb-6 text-center text-gray-600">
            Invite family members to start planning and achieving goals
            together.
          </p>

          {/* Sent animation overlay */}
          {showSentAnimation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div
                className={cn(
                  "flex flex-col items-center",
                  !prefersReducedMotion && "animate-sent"
                )}
              >
                <div className="mb-4 rounded-full bg-green-100 p-4">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {sentCount} invitation{sentCount !== 1 ? "s" : ""} sent!
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 w-full rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Invite form */}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex-1 space-y-2">
                  <Input
                    {...register(`invites.${index}.email`)}
                    placeholder="family@email.com"
                    type="email"
                    className="w-full"
                    aria-invalid={!!errors.invites?.[index]?.email}
                  />
                  {errors.invites?.[index]?.email && (
                    <p className="text-xs text-red-500">
                      {errors.invites[index].email?.message}
                    </p>
                  )}
                </div>

                <Select
                  value={watchedInvites[index]?.role || "adult"}
                  onValueChange={(value) =>
                    setValue(
                      `invites.${index}.role`,
                      value as (typeof ROLES)[number]["value"]
                    )
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add another button */}
            <button
              type="button"
              onClick={handleAddAnother}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-700"
            >
              <Plus className="h-4 w-4" />
              Add another
            </button>

            {/* Role guide */}
            <div className="rounded-lg bg-gray-50 p-3">
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Role guide:
              </Label>
              <ul className="space-y-1 text-xs text-gray-600">
                {ROLES.map((role) => (
                  <li key={role.value}>
                    <span className="font-medium">{role.label}:</span>{" "}
                    {role.description}
                  </li>
                ))}
              </ul>
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
                type="button"
                variant="ghost"
                onClick={onSkip}
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invites
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Helper text */}
          <p className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <Users className="mr-1 h-4 w-4" />
            You can always invite more members later.
          </p>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes sent-animation {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-sent {
          animation: sent-animation 0.5s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-sent {
            animation: none;
          }
        }
      `}</style>
    </OnboardingStep>
  );
}

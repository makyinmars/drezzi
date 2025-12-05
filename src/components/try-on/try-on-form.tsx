import { Trans, useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/react";

type TryOnFormProps = {
  children?: React.ReactNode;
  preselectedGarmentId?: string;
  preselectedProfileId?: string;
};

const TryOnForm = ({
  children,
  preselectedGarmentId,
  preselectedProfileId,
}: TryOnFormProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [profileId, setProfileId] = useState(preselectedProfileId ?? "");
  const [garmentId, setGarmentId] = useState(preselectedGarmentId ?? "");

  const { data: profiles } = useSuspenseQuery(trpc.profile.list.queryOptions());

  const { data: garments } = useSuspenseQuery(
    trpc.garment.list.queryOptions({ includePublic: true })
  );

  const createMutation = useMutation(
    trpc.tryOn.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData(trpc.tryOn.list.queryKey({}), (old) => {
          if (!old) return [data];
          return [data, ...old];
        });
        setOpen(false);
        setProfileId(preselectedProfileId ?? "");
        setGarmentId(preselectedGarmentId ?? "");
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!(profileId && garmentId)) {
      toast.error(t`Please select both a profile and a garment`);
      return;
    }

    toast.promise(
      createMutation.mutateAsync({
        bodyProfileId: profileId,
        garmentId,
      }),
      {
        loading: t`Starting try-on...`,
        success: t`Try-on started! It will be ready in a few moments.`,
        error: (err) => t`Failed to start try-on: ${err.message}`,
      }
    );
  };

  const defaultProfile = profiles.find((p) => p.isDefault);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            <Trans>New Try-On</Trans>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Trans>Virtual Try-On</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Select a body profile and a garment to see how it looks on you.
            </Trans>
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="profile">
              <Trans>Body Profile</Trans>
            </Label>
            <Select
              onValueChange={setProfileId}
              value={profileId || defaultProfile?.id || ""}
            >
              <SelectTrigger id="profile">
                <SelectValue placeholder={t`Select a profile`} />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                    {profile.isDefault && " (Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {profiles.length === 0 && (
              <p className="text-muted-foreground text-sm">
                <Trans>
                  No profiles found. Please create a body profile first.
                </Trans>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="garment">
              <Trans>Garment</Trans>
            </Label>
            <Select onValueChange={setGarmentId} value={garmentId}>
              <SelectTrigger id="garment">
                <SelectValue placeholder={t`Select a garment`} />
              </SelectTrigger>
              <SelectContent>
                {garments.map((garment) => (
                  <SelectItem key={garment.id} value={garment.id}>
                    {garment.name} - {garment.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {garments.length === 0 && (
              <p className="text-muted-foreground text-sm">
                <Trans>
                  No garments found. Please add a garment to your wardrobe
                  first.
                </Trans>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              <Trans>Cancel</Trans>
            </Button>
            <Button
              disabled={
                createMutation.isPending ||
                !profileId ||
                !garmentId ||
                profiles.length === 0 ||
                garments.length === 0
              }
              type="submit"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <Trans>Starting...</Trans>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <Trans>Start Try-On</Trans>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TryOnForm;

import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/react";
import { apiTryOnCreate, type TryOnCreate } from "@/validators/try-on";

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

  const { data: profiles } = useSuspenseQuery(trpc.profile.list.queryOptions());
  const defaultProfile = profiles.find((p) => p.isDefault);

  const form = useForm<TryOnCreate>({
    resolver: zodResolver(apiTryOnCreate),
    defaultValues: {
      bodyProfileId: preselectedProfileId ?? defaultProfile?.id ?? "",
      garmentId: preselectedGarmentId ?? "",
    },
  });

  const { data: garments } = useSuspenseQuery(
    trpc.garment.list.queryOptions({ includePublic: true })
  );

  const createMutation = useMutation(
    trpc.tryOn.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.tryOn.list.queryKey(),
        });
        setOpen(false);
        form.reset();
      },
    })
  );

  const onSubmit = (data: TryOnCreate) => {
    const formData = new FormData();
    formData.append("bodyProfileId", data.bodyProfileId);
    formData.append("garmentId", data.garmentId);

    toast.promise(createMutation.mutateAsync(formData), {
      loading: t`Starting try-on...`,
      success: t`Try-on started! It will be ready in a few moments.`,
      error: (err) => t`Failed to start try-on: ${err.message}`,
    });
  };

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
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="bodyProfileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Body Profile</Trans>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t`Select a profile`} />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="garmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Garment</Trans>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t`Select a garment`} />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                <Trans>Cancel</Trans>
              </Button>
              <Button
                disabled={profiles.length === 0 || garments.length === 0}
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TryOnForm;

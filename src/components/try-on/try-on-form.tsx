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

import MediaDisplay from "@/components/common/media-display";
import { Combobox } from "@/components/custom/combobox";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  ResponsivePanel,
  ResponsivePanelContent,
  ResponsivePanelDescription,
  ResponsivePanelHeader,
  ResponsivePanelTitle,
  ResponsivePanelTrigger,
} from "@/components/ui/responsive-panel";
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
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.recent.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.dashboard.stats.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.dashboard.recentActivity.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.lookbook.availableTryOns.queryKey(),
          }),
        ]);
        setOpen(false);
        form.reset();
      },
    })
  );

  const onSubmit = (data: TryOnCreate) => {
    const formData = new FormData();
    formData.append("bodyProfileId", data.bodyProfileId);
    formData.append("garmentId", data.garmentId);

    createMutation.mutate(formData, {
      onSuccess: (result) => {
        toast.loading(t`Queued - waiting to start...`, {
          id: result.id,
          duration: 300000, // 5 minutes - matches Lambda timeout
        });
      },
      onError: (err) => {
        toast.error(t`Failed to start try-on: ${err.message}`);
      },
    });
  };

  const trigger = children ?? (
    <Button>
      <Sparkles className="mr-2 h-4 w-4" />
      <Trans>New Try-On</Trans>
    </Button>
  );

  const formContent = (
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
              <Combobox
                emptyMessage={t`No profile found.`}
                getItemLabel={(profile) =>
                  profile.isDefault ? `${profile.name} (Default)` : profile.name
                }
                getItemValue={(profile) => profile.id}
                items={profiles}
                onValueChange={field.onChange}
                placeholder={t`Select a profile`}
                renderPreview={(profile) => (
                  <Item size="sm" variant="muted">
                    <ItemMedia className="size-25" variant="image">
                      <MediaDisplay
                        alt={profile.name}
                        fit="cover"
                        src={profile.photoUrl}
                      />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{profile.name}</ItemTitle>
                      <ItemDescription>
                        {profile.fitPreference}
                        {profile.isDefault && (
                          <>
                            {" "}
                            · <Trans>Default</Trans>
                          </>
                        )}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )}
                searchPlaceholder={t`Search profiles...`}
                value={field.value}
              />
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
              <Combobox
                emptyMessage={t`No garment found.`}
                getItemLabel={(garment) =>
                  `${garment.name} - ${garment.category}`
                }
                getItemValue={(garment) => garment.id}
                items={garments}
                onValueChange={field.onChange}
                placeholder={t`Select a garment`}
                renderPreview={(garment) => (
                  <Item size="sm" variant="muted">
                    <ItemMedia className="size-25" variant="image">
                      <MediaDisplay
                        alt={garment.name}
                        fit="cover"
                        src={garment.imageUrl}
                      />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{garment.name}</ItemTitle>
                      <ItemDescription>
                        {garment.category}
                        {garment.brand && ` · ${garment.brand}`}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )}
                searchPlaceholder={t`Search garments...`}
                value={field.value}
              />
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
  );

  return (
    <ResponsivePanel onOpenChange={setOpen} open={open}>
      <ResponsivePanelTrigger asChild>{trigger}</ResponsivePanelTrigger>
      <ResponsivePanelContent>
        <ResponsivePanelHeader>
          <ResponsivePanelTitle>
            <Trans>Virtual Try-On</Trans>
          </ResponsivePanelTitle>
          <ResponsivePanelDescription>
            <Trans>
              Select a body profile and a garment to see how it looks on you.
            </Trans>
          </ResponsivePanelDescription>
        </ResponsivePanelHeader>
        <div className="p-4">{formContent}</div>
      </ResponsivePanelContent>
    </ResponsivePanel>
  );
};

export default TryOnForm;

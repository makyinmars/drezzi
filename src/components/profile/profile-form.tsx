import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BodyProfile } from "generated/prisma/client";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTRPC } from "@/trpc/react";
import {
  apiBodyProfileCreateAndUpdate,
  type BodyProfileCreateAndUpdate,
} from "@/validators/profile";

import PhotoUpload from "./photo-upload";

type ProfileFormProps = {
  profile?: BodyProfile;
  children?: React.ReactNode;
};

const ProfileForm = ({ profile, children }: ProfileFormProps) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<BodyProfileCreateAndUpdate>({
    resolver: zodResolver(apiBodyProfileCreateAndUpdate),
    defaultValues: {
      id: profile?.id,
      name: profile?.name || "Default",
      photoUrl: profile?.photoUrl,
      photoKey: profile?.photoKey,
      height: profile?.height,
      waist: profile?.waist,
      hip: profile?.hip,
      inseam: profile?.inseam,
      chest: profile?.chest,
      fitPreference:
        (profile?.fitPreference as
          | "slim"
          | "regular"
          | "relaxed"
          | "loose"
          | undefined) || "regular",
      isDefault: profile?.isDefault ?? false,
    },
  });

  const createMutation = useMutation(
    trpc.profile.create.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.profile.list.queryKey(),
          exact: true,
        });

        const previousData = queryClient.getQueryData(
          trpc.profile.list.queryKey()
        );

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const optimisticProfile = {
          id: tempId,
          userId: "",
          name: variables.name ?? "Default",
          photoUrl: variables.photoUrl,
          photoKey: variables.photoKey,
          height: variables.height ?? null,
          waist: variables.waist ?? null,
          hip: variables.hip ?? null,
          inseam: variables.inseam ?? null,
          chest: variables.chest ?? null,
          fitPreference: variables.fitPreference ?? "regular",
          isDefault: variables.isDefault ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData(trpc.profile.list.queryKey(), (old) => {
          if (!old) {
            return [optimisticProfile];
          }
          return [optimisticProfile, ...old];
        });

        return { previousData, optimisticProfile };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.profile.list.queryKey(),
          context?.previousData
        );
      },
      onSuccess: (created, _variables, context) => {
        queryClient.setQueryData(trpc.profile.list.queryKey(), (old) => {
          if (!old) {
            return [created];
          }
          return old.map((p) =>
            p.id === context?.optimisticProfile.id ? created : p
          );
        });
        form.reset();
        setOpen(false);
      },
    })
  );

  const updateMutation = useMutation(
    trpc.profile.update.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.profile.list.queryKey(),
          exact: true,
        });

        const previousData = queryClient.getQueryData(
          trpc.profile.list.queryKey()
        );

        queryClient.setQueryData(trpc.profile.list.queryKey(), (old) => {
          if (!old) {
            return previousData;
          }
          return old.map((p) =>
            p.id === variables.id
              ? { ...p, ...variables, updatedAt: new Date() }
              : p
          );
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.profile.list.queryKey(),
          context?.previousData
        );
      },
      onSuccess: async (updated) => {
        queryClient.setQueryData(trpc.profile.list.queryKey(), (old) => {
          if (!old) {
            return [updated];
          }
          return old.map((p) => (p.id === updated.id ? updated : p));
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.byId.queryKey({ id: updated.id }),
        });
        setOpen(false);
      },
    })
  );

  const handlePhotoUpload = (photoUrl: string, photoKey: string) => {
    form.setValue("photoUrl", photoUrl);
    form.setValue("photoKey", photoKey);
  };

  const onSubmit = (data: BodyProfileCreateAndUpdate) => {
    if (!(data.photoUrl && data.photoKey)) {
      toast.error(t`Please upload a photo first`);
      return;
    }

    if (data.id) {
      toast.promise(
        updateMutation.mutateAsync({
          id: data.id,
          name: data.name,
          photoUrl: data.photoUrl,
          photoKey: data.photoKey,
          height: data.height,
          waist: data.waist,
          hip: data.hip,
          inseam: data.inseam,
          chest: data.chest,
          fitPreference: data.fitPreference,
          isDefault: data.isDefault,
        }),
        {
          loading: t`Updating profile...`,
          success: (updated) => t`"${updated.name}" has been updated`,
          error: (err) => t`Error updating profile: ${err.message}`,
        }
      );
    } else {
      toast.promise(
        createMutation.mutateAsync({
          name: data.name,
          photoUrl: data.photoUrl,
          photoKey: data.photoKey,
          height: data.height ?? undefined,
          waist: data.waist ?? undefined,
          hip: data.hip ?? undefined,
          inseam: data.inseam ?? undefined,
          chest: data.chest ?? undefined,
          fitPreference: data.fitPreference,
          isDefault: data.isDefault,
        }),
        {
          loading: t`Creating profile...`,
          success: (created) => t`"${created.name}" has been created`,
          error: (err) => t`Error creating profile: ${err.message}`,
        }
      );
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {profile ? (
              <Trans>Edit Body Profile</Trans>
            ) : (
              <Trans>Create Body Profile</Trans>
            )}
          </DialogTitle>
          <DialogDescription>
            {profile ? (
              <Trans>Update your body profile for virtual try-ons</Trans>
            ) : (
              <Trans>Add a new body profile for virtual try-ons</Trans>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <PhotoUpload
              currentPhotoUrl={profile?.photoUrl}
              onUploadComplete={handlePhotoUpload}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Profile Name</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t`e.g., Default, Casual, Formal`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Height (cm)</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="175"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Chest (cm)</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="95"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Waist (cm)</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="80"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Hip (cm)</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="95"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inseam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Inseam (cm)</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="80"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fitPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Fit Preference</Trans>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t`Select fit preference`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="slim">
                        <Trans>Slim</Trans>
                      </SelectItem>
                      <SelectItem value="regular">
                        <Trans>Regular</Trans>
                      </SelectItem>
                      <SelectItem value="relaxed">
                        <Trans>Relaxed</Trans>
                      </SelectItem>
                      <SelectItem value="loose">
                        <Trans>Loose</Trans>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>
                      <Trans>Default Profile</Trans>
                    </FormLabel>
                    <div className="text-muted-foreground text-sm">
                      <Trans>
                        Use this profile as your default for try-ons
                      </Trans>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              className="w-full"
              disabled={
                profile ? updateMutation.isPending : createMutation.isPending
              }
              type="submit"
            >
              {profile ? (
                <Trans>Update Profile</Trans>
              ) : (
                <Trans>Create Profile</Trans>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileForm;

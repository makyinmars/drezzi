import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit, Eye, MoreHorizontal, Star, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import MediaDisplay from "@/components/common/media-display";
import CardMediaDisplay from "@/components/custom/card-media-display";
import ImageUpload from "@/components/custom/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ResponsivePanel,
  ResponsivePanelContent,
  ResponsivePanelDescription,
  ResponsivePanelFooter,
  ResponsivePanelHeader,
  ResponsivePanelTitle,
} from "@/components/ui/responsive-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTRPC } from "@/trpc/react";
import type { ProfileListProcedure } from "@/trpc/routers/profile";
import {
  apiBodyProfileCreateAndUpdate,
  type BodyProfileCreateAndUpdate,
} from "@/validators/profile";

import ProfileDelete from "./profile-delete";

type ProfileCardProps = {
  profile: ProfileListProcedure[number];
};

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<BodyProfileCreateAndUpdate>({
    resolver: zodResolver(apiBodyProfileCreateAndUpdate),
    defaultValues: {
      id: profile.id,
      name: profile.name,
      photoId: profile.photoId,
      height: profile.height,
      waist: profile.waist,
      hip: profile.hip,
      inseam: profile.inseam,
      chest: profile.chest,
      fitPreference:
        (profile.fitPreference as
          | "slim"
          | "regular"
          | "relaxed"
          | "loose"
          | undefined) ?? "regular",
      isDefault: profile.isDefault,
    },
  });

  const setDefaultMutation = useMutation(
    trpc.profile.setDefault.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.profile.list.queryKey(),
          exact: true,
        });

        const previousData = queryClient.getQueryData(
          trpc.profile.list.queryKey()
        );

        queryClient.setQueryData(trpc.profile.list.queryKey(), (old) => {
          if (!old) return previousData;
          return old.map((p) => ({
            ...p,
            isDefault: p.id === variables.id,
          }));
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.profile.list.queryKey(),
          context?.previousData
        );
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.byId.queryKey({ id: profile.id }),
        });
      },
    })
  );

  const updateMutation = useMutation(
    trpc.profile.update.mutationOptions({
      onSuccess: async (updated) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.byId.queryKey({ id: updated.id }),
        });
        setMode("view");
        setSelectedFile(null);
      },
    })
  );

  const handleSetDefault = () => {
    if (profile.isDefault) return;
    toast.promise(setDefaultMutation.mutateAsync({ id: profile.id }), {
      loading: t`Setting as default...`,
      success: () => t`"${profile.name}" is now your default profile`,
      error: (err) => t`Error setting default: ${err.message}`,
    });
  };

  const handleOpenPanel = (panelMode: "view" | "edit") => {
    setMode(panelMode);
    setPanelOpen(true);
  };

  const handlePanelOpenChange = (open: boolean) => {
    setPanelOpen(open);
    if (!open) {
      setMode("view");
      setSelectedFile(null);
      form.reset();
    }
  };

  const buildFormData = (
    data: BodyProfileCreateAndUpdate,
    file: File | null
  ) => {
    const formData = new FormData();
    if (data.id) formData.append("id", data.id);
    if (file) formData.append("file", file);
    formData.append("name", data.name);
    formData.append("fitPreference", data.fitPreference);
    formData.append("isDefault", String(data.isDefault));

    const appendNumber = (key: string, value: number | null | undefined) => {
      if (value === null) {
        formData.append(key, "");
      } else if (value !== undefined) {
        formData.append(key, value.toString());
      }
    };

    appendNumber("height", data.height);
    appendNumber("waist", data.waist);
    appendNumber("hip", data.hip);
    appendNumber("inseam", data.inseam);
    appendNumber("chest", data.chest);

    return formData;
  };

  const onSubmit = async (data: BodyProfileCreateAndUpdate) => {
    const formData = buildFormData(data, selectedFile);
    toast.promise(updateMutation.mutateAsync(formData), {
      loading: t`Updating profile...`,
      success: (updated) => t`"${updated.name}" has been updated`,
      error: (err) => t`Error updating profile: ${err.message}`,
    });
  };

  const measurements = [
    { label: t`Height`, value: profile.height, unit: "cm" },
    { label: t`Chest`, value: profile.chest, unit: "cm" },
    { label: t`Waist`, value: profile.waist, unit: "cm" },
    { label: t`Hip`, value: profile.hip, unit: "cm" },
    { label: t`Inseam`, value: profile.inseam, unit: "cm" },
  ].filter((m) => m.value !== null);

  const statusBadge = profile.isDefault ? (
    <Badge variant="secondary">
      <Check className="mr-1 h-3 w-3" />
      <Trans>Default</Trans>
    </Badge>
  ) : undefined;

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          size="icon"
          variant="secondary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenPanel("view")}>
          <Eye />
          <Trans>View</Trans>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenPanel("edit")}>
          <Edit />
          <Trans>Edit</Trans>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={profile.isDefault || setDefaultMutation.isPending}
          onClick={handleSetDefault}
        >
          <Star />
          <Trans>Set Default</Trans>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteOpen(true)}
          variant="destructive"
        >
          <Trash />
          <Trans>Delete</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <CardMediaDisplay
        alt={profile.name}
        imageUrl={profile.photoUrl}
        topLeft={statusBadge}
        topRight={actionsMenu}
      >
        <h3 className="truncate font-medium text-foreground">{profile.name}</h3>
        <div className="mt-0.5 flex flex-wrap gap-1">
          <Badge variant="outline">{profile.fitPreference}</Badge>
          {measurements.length > 0 && (
            <Badge variant="outline">
              <Trans>{measurements.length} measurements</Trans>
            </Badge>
          )}
        </div>
      </CardMediaDisplay>

      <ResponsivePanel onOpenChange={handlePanelOpenChange} open={panelOpen}>
        <ResponsivePanelContent>
          <ResponsivePanelHeader>
            <ResponsivePanelTitle>
              {mode === "view" ? (
                <Trans>Profile Details</Trans>
              ) : (
                <Trans>Edit Profile</Trans>
              )}
            </ResponsivePanelTitle>
            <ResponsivePanelDescription>
              {mode === "view" ? (
                <Trans>View your body profile details</Trans>
              ) : (
                <Trans>Update your body profile for virtual try-ons</Trans>
              )}
            </ResponsivePanelDescription>
          </ResponsivePanelHeader>

          {mode === "view" ? (
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <MediaDisplay
                  alt={profile.name}
                  aspectRatio="4/5"
                  className="w-full rounded-lg md:w-1/3"
                  fit="cover"
                  src={profile.photoUrl}
                  variant="card"
                />
                <div className="flex flex-1 flex-col gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="outline">{profile.fitPreference}</Badge>
                      {profile.isDefault && (
                        <Badge variant="secondary">
                          <Check className="mr-1 h-3 w-3" />
                          <Trans>Default</Trans>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {measurements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-muted-foreground text-sm">
                        <Trans>Measurements</Trans>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {measurements.map((m) => (
                          <div className="flex justify-between" key={m.label}>
                            <span className="text-muted-foreground">
                              {m.label}:
                            </span>
                            <span>
                              {m.value} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <ResponsivePanelFooter>
                <Button
                  className="w-full"
                  onClick={() => setMode("edit")}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <Trans>Edit Profile</Trans>
                </Button>
              </ResponsivePanelFooter>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <div className="flex flex-col gap-4 md:flex-row">
                    <ImageUpload
                      alt="Profile preview"
                      currentImageUrl={profile.photoUrl}
                      onFileSelect={setSelectedFile}
                      uploadLabel={
                        <Trans>Drop photo here or click to upload</Trans>
                      }
                    />
                    <div className="flex flex-1 flex-col gap-2">
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
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null
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
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null
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
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null
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
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null
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
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null
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
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="fitPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Trans>Fit Preference</Trans>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t`Select fit preference`}
                              />
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

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => setMode("view")}
                      type="button"
                      variant="outline"
                    >
                      <Trans>Cancel</Trans>
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={updateMutation.isPending}
                      type="submit"
                    >
                      <Trans>Update Profile</Trans>
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </ResponsivePanelContent>
      </ResponsivePanel>

      <ProfileDelete
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        profile={profile}
      />
    </>
  );
};

export default ProfileCard;

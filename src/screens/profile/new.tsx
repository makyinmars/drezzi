import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Camera, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import PageHeader from "@/components/common/page-header";
import PhotoUpload from "@/components/profile/photo-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const ProfileNewScreen = () => {
  const { t } = useLingui();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<BodyProfileCreateAndUpdate>({
    resolver: zodResolver(apiBodyProfileCreateAndUpdate),
    defaultValues: {
      name: "Default",
      fitPreference: "regular",
      isDefault: true,
      height: null,
      waist: null,
      hip: null,
      inseam: null,
      chest: null,
    },
  });

  const createMutation = useMutation(
    trpc.profile.create.mutationOptions({
      onSuccess: async (created) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.list.queryKey(),
        });
        router.navigate({
          to: "/profile/$profileId",
          params: { profileId: created.id },
        });
      },
    })
  );

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const buildFormData = (
    data: BodyProfileCreateAndUpdate,
    file: File | null
  ) => {
    const formData = new FormData();
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
    if (!selectedFile) {
      toast.error(t`Please upload a photo first`);
      return;
    }

    const formData = buildFormData(data, selectedFile);

    toast.promise(createMutation.mutateAsync(formData), {
      loading: t`Creating profile...`,
      success: (created) => t`"${created.name}" has been created`,
      error: (err) => t`Error creating profile: ${err.message}`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild size="sm" variant="ghost">
            <a href="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <Trans>Back</Trans>
            </a>
          </Button>
        }
        description={t`Add a new body profile for virtual try-ons`}
        title={t`Create Body Profile`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Photo</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>
                      Upload a full-body photo for the best try-on results
                    </Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoUpload onFileSelect={handleFileSelect} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Profile Information</Trans>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Measurements (Optional)</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>
                      Adding measurements helps improve try-on accuracy
                    </Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Button
                className="w-full"
                disabled={createMutation.isPending}
                size="lg"
                type="submit"
              >
                <Trans>Create Profile</Trans>
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-4">
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertTitle>
              <Trans>Photo Tips</Trans>
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  <Trans>Stand in front of a plain background</Trans>
                </li>
                <li>
                  <Trans>Wear fitted clothing for best results</Trans>
                </li>
                <li>
                  <Trans>Ensure good, even lighting</Trans>
                </li>
                <li>
                  <Trans>Face the camera directly</Trans>
                </li>
                <li>
                  <Trans>Include your full body in the frame</Trans>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>
              <Trans>About Measurements</Trans>
            </AlertTitle>
            <AlertDescription className="text-sm">
              <Trans>
                Measurements are optional but help improve the accuracy of
                virtual try-ons. You can always add them later.
              </Trans>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default ProfileNewScreen;

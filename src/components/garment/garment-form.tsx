import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  ResponsivePanelHeader,
  ResponsivePanelTitle,
  ResponsivePanelTrigger,
} from "@/components/ui/responsive-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/react";
import type { GarmentListProcedure } from "@/trpc/routers/garment";
import {
  apiGarmentCreateAndUpdate,
  GARMENT_CATEGORIES,
  type GarmentCreateAndUpdate,
} from "@/validators/garment";

import GarmentImageUpload from "./garment-image-upload";

type GarmentFormProps = {
  garment?: GarmentListProcedure[number];
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const GarmentForm = ({
  garment,
  children,
  open: controlledOpen,
  onOpenChange,
}: GarmentFormProps) => {
  const { t } = useLingui();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<GarmentCreateAndUpdate>({
    resolver: zodResolver(apiGarmentCreateAndUpdate),
    defaultValues: {
      id: garment?.id,
      name: garment?.name ?? "",
      description: garment?.description ?? null,
      category:
        (garment?.category as GarmentCreateAndUpdate["category"]) ?? "tops",
      subcategory: garment?.subcategory ?? null,
      brand: garment?.brand ?? null,
      price: garment?.price ?? null,
      currency:
        (garment?.currency as GarmentCreateAndUpdate["currency"]) ?? "USD",
      imageId: garment?.imageId,
      maskId: garment?.maskId ?? null,
      retailUrl: garment?.retailUrl ?? null,
      colors: garment?.colors ?? [],
      sizes: garment?.sizes ?? [],
      tags: garment?.tags ?? [],
      isActive: garment?.isActive ?? true,
      isPublic: garment?.isPublic ?? false,
    },
  });

  const createMutation = useMutation(
    trpc.garment.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.garment.list.queryKey(),
        });
        form.reset();
        setOpen(false);
      },
    })
  );

  const updateMutation = useMutation(
    trpc.garment.update.mutationOptions({
      onSuccess: async (updated) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.garment.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.garment.byId.queryKey({ id: updated.id }),
        });
        setOpen(false);
      },
    })
  );

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const buildFormData = (data: GarmentCreateAndUpdate, file: File | null) => {
    const formData = new FormData();
    if (data.id) formData.append("id", data.id);
    if (file) formData.append("file", file);
    formData.append("name", data.name);
    formData.append("description", data.description ?? "");
    formData.append("category", data.category);
    formData.append("subcategory", data.subcategory ?? "");
    formData.append("brand", data.brand ?? "");
    if (data.price !== null && data.price !== undefined) {
      formData.append("price", data.price.toString());
    } else {
      formData.append("price", "");
    }
    formData.append("currency", data.currency);
    formData.append("maskId", data.maskId ?? "");
    formData.append("retailUrl", data.retailUrl ?? "");
    formData.append("colors", JSON.stringify(data.colors ?? []));
    formData.append("sizes", JSON.stringify(data.sizes ?? []));
    formData.append("tags", JSON.stringify(data.tags ?? []));
    formData.append("isActive", String(data.isActive));
    formData.append("isPublic", String(data.isPublic));
    return formData;
  };

  const onSubmit = async (data: GarmentCreateAndUpdate) => {
    const formData = buildFormData(data, selectedFile);

    if (!(data.id || selectedFile)) {
      toast.error(t`Please upload an image first`);
      return;
    }

    if (data.id) {
      toast.promise(updateMutation.mutateAsync(formData), {
        loading: t`Updating garment...`,
        success: (updated) => t`"${updated.name}" has been updated`,
        error: (err) => t`Error updating garment: ${err.message}`,
      });
    } else {
      toast.promise(createMutation.mutateAsync(formData), {
        loading: t`Creating garment...`,
        success: (created) => t`"${created.name}" has been added`,
        error: (err) => t`Error creating garment: ${err.message}`,
      });
    }
  };

  return (
    <ResponsivePanel onOpenChange={setOpen} open={open}>
      {children && (
        <ResponsivePanelTrigger asChild>{children}</ResponsivePanelTrigger>
      )}
      <ResponsivePanelContent>
        <ResponsivePanelHeader>
          <ResponsivePanelTitle>
            {garment ? <Trans>Edit Garment</Trans> : <Trans>Add Garment</Trans>}
          </ResponsivePanelTitle>
          <ResponsivePanelDescription>
            {garment ? (
              <Trans>Update your garment details</Trans>
            ) : (
              <Trans>Add a new garment to your wardrobe</Trans>
            )}
          </ResponsivePanelDescription>
        </ResponsivePanelHeader>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 md:flex-row">
                <GarmentImageUpload
                  currentImageUrl={garment?.imageUrl}
                  onFileSelect={handleFileSelect}
                />
                <div className="flex flex-1 flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Trans>Name</Trans>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t`e.g., Blue Oxford Shirt`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Trans>Description</Trans>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t`Optional description...`}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>Category</Trans>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t`Select category`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GARMENT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>Brand</Trans>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t`e.g., Nike`}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>Price</Trans>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="99.99"
                              step="0.01"
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
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>Currency</Trans>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="AUD">AUD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="retailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Retail URL</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t`https://...`}
                        type="url"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>
                        <Trans>Public</Trans>
                      </FormLabel>
                      <div className="text-muted-foreground text-sm">
                        <Trans>
                          Allow others to see and try on this garment
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
                  garment ? updateMutation.isPending : createMutation.isPending
                }
                type="submit"
              >
                {garment ? (
                  <Trans>Update Garment</Trans>
                ) : (
                  <Trans>Add Garment</Trans>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </ResponsivePanelContent>
    </ResponsivePanel>
  );
};

export default GarmentForm;

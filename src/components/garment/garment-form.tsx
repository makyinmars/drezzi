import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ImageUpload from "@/components/custom/image-upload";
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
  const [importUrl, setImportUrl] = useState("");
  const [importedImageId, setImportedImageId] = useState<string | null>(null);
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null);
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

  const importMutation = useMutation(
    trpc.garment.importFromUrl.mutationOptions({
      onSuccess: (data) => {
        form.setValue("name", data.name);
        if (data.description) form.setValue("description", data.description);
        if (data.price) form.setValue("price", data.price);
        if (data.currency) form.setValue("currency", data.currency);
        if (data.brand) form.setValue("brand", data.brand);
        if (data.category) form.setValue("category", data.category);
        if (data.subcategory) form.setValue("subcategory", data.subcategory);
        if (data.retailUrl) form.setValue("retailUrl", data.retailUrl);
        if (data.colors.length > 0) form.setValue("colors", data.colors);
        if (data.sizes.length > 0) form.setValue("sizes", data.sizes);
        if (data.uploadedImageId) {
          setImportedImageId(data.uploadedImageId);
          setImportedImageUrl(data.uploadedImageUrl);
        }
      },
    })
  );

  const handleImport = () => {
    if (!importUrl.trim()) return;
    toast.promise(importMutation.mutateAsync({ url: importUrl }), {
      loading: t`Importing product details...`,
      success: t`Product imported successfully`,
      error: (err) => t`Failed to import: ${err.message}`,
    });
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setImportedImageId(null);
      setImportedImageUrl(null);
    }
  };

  const buildFormData = (
    data: GarmentCreateAndUpdate,
    file: File | null,
    preUploadedImageId: string | null
  ) => {
    const formData = new FormData();
    if (data.id) formData.append("id", data.id);
    if (preUploadedImageId) {
      formData.append("imageId", preUploadedImageId);
    } else if (file) {
      formData.append("file", file);
    }
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
    if (!(data.id || selectedFile || importedImageId)) {
      toast.error(t`Please upload an image first`);
      return;
    }

    const formData = buildFormData(data, selectedFile, importedImageId);

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
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
          {!garment && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link2 className="size-4" />
                    <Trans>Import from URL</Trans>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    <Trans>
                      Paste a product URL to auto-fill details from retailers
                    </Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      disabled={importMutation.isPending}
                      onChange={(e) => setImportUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleImport();
                        }
                      }}
                      placeholder={t`https://www.zara.com/us/en/...`}
                      type="url"
                      value={importUrl}
                    />
                    <Button
                      disabled={!importUrl.trim() || importMutation.isPending}
                      onClick={handleImport}
                      type="button"
                    >
                      {importMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <Trans>Importing...</Trans>
                        </>
                      ) : (
                        <Trans>Import</Trans>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  <Trans>Import Limitations</Trans>
                </AlertTitle>
                <AlertDescription className="text-sm">
                  <Trans>
                    Product images may not always import automatically. If the
                    image doesn't appear, please upload one manually.
                  </Trans>
                </AlertDescription>
              </Alert>
            </>
          )}

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 md:flex-row">
                <ImageUpload
                  alt="Garment preview"
                  currentImageUrl={importedImageUrl ?? garment?.imageUrl}
                  onFileSelect={handleFileSelect}
                  uploadLabel={
                    <Trans>Drop garment image here or click to upload</Trans>
                  }
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

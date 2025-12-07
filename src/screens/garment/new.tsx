import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Info, Link2, Loader2, Shirt } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import PageHeader from "@/components/common/page-header";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";
import {
  apiGarmentCreateAndUpdate,
  GARMENT_CATEGORIES,
  type GarmentCreateAndUpdate,
} from "@/validators/garment";

const GarmentNewScreen = () => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importedImageId, setImportedImageId] = useState<string | null>(null);
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null);

  const form = useForm<GarmentCreateAndUpdate>({
    resolver: zodResolver(apiGarmentCreateAndUpdate),
    defaultValues: {
      name: "",
      description: null,
      category: "tops",
      subcategory: null,
      brand: null,
      price: null,
      currency: "USD",
      maskId: null,
      retailUrl: null,
      colors: [],
      sizes: [],
      tags: [],
      isActive: true,
      isPublic: false,
    },
  });

  const createMutation = useMutation(
    trpc.garment.create.mutationOptions({
      onSuccess: async (created) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.garment.list.queryKey(),
        });
        router.navigate({
          to: "/garment/$garmentId",
          params: { garmentId: created.id },
        });
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
    if (!(selectedFile || importedImageId)) {
      toast.error(t`Please upload an image first`);
      return;
    }

    const formData = buildFormData(data, selectedFile, importedImageId);

    toast.promise(createMutation.mutateAsync(formData), {
      loading: t`Adding garment...`,
      success: (created) => t`"${created.name}" has been added`,
      error: (err) => t`Error adding garment: ${err.message}`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild size={isMobile ? "icon" : "sm"} variant="ghost">
            <Link to="/garment">
              <ArrowLeft className="size-4" />
              {!isMobile && <Trans>Back</Trans>}
            </Link>
          </Button>
        }
        description={t`Add a new garment to your wardrobe`}
        title={t`Add Garment`}
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <Alert>
            <Shirt className="h-4 w-4" />
            <AlertTitle>
              <Trans>Image Tips</Trans>
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  <Trans>Use a plain, light background</Trans>
                </li>
                <li>
                  <Trans>Show the full garment clearly</Trans>
                </li>
                <li>
                  <Trans>Ensure good lighting</Trans>
                </li>
                <li>
                  <Trans>Flat lay or hanger shots work best</Trans>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>
              <Trans>About Public Garments</Trans>
            </AlertTitle>
            <AlertDescription className="text-sm">
              <Trans>
                Public garments can be seen and tried on by other users. Keep
                garments private if you want them for personal use only.
              </Trans>
            </AlertDescription>
          </Alert>
        </div>

        <div className="lg:col-span-2">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="size-5" />
                    <Trans>Import from URL</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>
                      Paste a product URL to auto-fill details from retailers
                      like Zara, H&M, ASOS
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

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Image</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>Upload a clear image of the garment</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    alt="Garment preview"
                    currentImageUrl={importedImageUrl ?? undefined}
                    onFileSelect={handleFileSelect}
                    uploadLabel={
                      <Trans>Drop garment image here or click to upload</Trans>
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Basic Information</Trans>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Pricing (Optional)</Trans>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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

                  <FormField
                    control={form.control}
                    name="retailUrl"
                    render={({ field }) => (
                      <FormItem className="mt-4">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Visibility</Trans>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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
                </CardContent>
              </Card>

              <Button
                className="w-full"
                disabled={createMutation.isPending}
                size="lg"
                type="submit"
              >
                <Trans>Add Garment</Trans>
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default GarmentNewScreen;

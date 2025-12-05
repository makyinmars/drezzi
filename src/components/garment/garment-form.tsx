import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Garment } from "generated/prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/react";
import {
  apiGarmentCreateAndUpdate,
  GARMENT_CATEGORIES,
  type GarmentCreateAndUpdate,
} from "@/validators/garment";

import GarmentImageUpload from "./garment-image-upload";

type GarmentFormProps = {
  garment?: Garment;
  children?: React.ReactNode;
};

const GarmentForm = ({ garment, children }: GarmentFormProps) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
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
      imageUrl: garment?.imageUrl,
      imageKey: garment?.imageKey,
      maskUrl: garment?.maskUrl ?? null,
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
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.garment.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.garment.list.queryKey({ includePublic: false })
        );

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const optimisticGarment = {
          id: tempId,
          userId: "",
          name: variables.name,
          description: variables.description ?? null,
          category: variables.category,
          subcategory: variables.subcategory ?? null,
          brand: variables.brand ?? null,
          price: variables.price ?? null,
          currency: variables.currency ?? "USD",
          imageUrl: variables.imageUrl,
          imageKey: variables.imageKey,
          maskUrl: variables.maskUrl ?? null,
          retailUrl: variables.retailUrl ?? null,
          colors: variables.colors ?? [],
          sizes: variables.sizes ?? [],
          tags: variables.tags ?? [],
          metadata: null,
          isActive: variables.isActive ?? true,
          isPublic: variables.isPublic ?? false,
          isOwner: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          (old) => {
            if (!old) {
              return [optimisticGarment];
            }
            return [optimisticGarment, ...old];
          }
        );

        return { previousData, optimisticGarment };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          context?.previousData
        );
      },
      onSuccess: (created, _variables, context) => {
        const createdWithOwner = {
          ...created,
          imageUrl: created.imageUrl,
          isOwner: true,
        };
        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          (old) => {
            if (!old) {
              return [createdWithOwner];
            }
            return old.map((g) =>
              g.id === context?.optimisticGarment.id ? createdWithOwner : g
            );
          }
        );
        form.reset();
        setOpen(false);
      },
    })
  );

  const updateMutation = useMutation(
    trpc.garment.update.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.garment.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.garment.list.queryKey({ includePublic: false })
        );

        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          (old) => {
            if (!old) {
              return previousData;
            }
            return old.map((g) =>
              g.id === variables.id
                ? { ...g, ...variables, updatedAt: new Date() }
                : g
            );
          }
        );

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          context?.previousData
        );
      },
      onSuccess: async (updated) => {
        const updatedWithOwner = {
          ...updated,
          imageUrl: updated.imageUrl,
          isOwner: true,
        };
        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          (old) => {
            if (!old) {
              return [updatedWithOwner];
            }
            return old.map((g) => (g.id === updated.id ? updatedWithOwner : g));
          }
        );
        await queryClient.invalidateQueries({
          queryKey: trpc.garment.byId.queryKey({ id: updated.id }),
        });
        setOpen(false);
      },
    })
  );

  const handleImageUpload = (imageUrl: string, imageKey: string) => {
    form.setValue("imageUrl", imageUrl);
    form.setValue("imageKey", imageKey);
  };

  const onSubmit = (data: GarmentCreateAndUpdate) => {
    if (!(data.imageUrl && data.imageKey)) {
      toast.error(t`Please upload an image first`);
      return;
    }

    if (data.id) {
      toast.promise(
        updateMutation.mutateAsync({
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory,
          brand: data.brand,
          price: data.price,
          currency: data.currency,
          imageUrl: data.imageUrl,
          imageKey: data.imageKey,
          maskUrl: data.maskUrl,
          retailUrl: data.retailUrl,
          colors: data.colors,
          sizes: data.sizes,
          tags: data.tags,
          isActive: data.isActive,
          isPublic: data.isPublic,
        }),
        {
          loading: t`Updating garment...`,
          success: (updated) => t`"${updated.name}" has been updated`,
          error: (err) => t`Error updating garment: ${err.message}`,
        }
      );
    } else {
      toast.promise(
        createMutation.mutateAsync({
          name: data.name,
          description: data.description ?? undefined,
          category: data.category,
          subcategory: data.subcategory ?? undefined,
          brand: data.brand ?? undefined,
          price: data.price ?? undefined,
          currency: data.currency,
          imageUrl: data.imageUrl,
          imageKey: data.imageKey,
          maskUrl: data.maskUrl ?? undefined,
          retailUrl: data.retailUrl ?? undefined,
          colors: data.colors,
          sizes: data.sizes,
          tags: data.tags,
          isActive: data.isActive,
          isPublic: data.isPublic,
        }),
        {
          loading: t`Creating garment...`,
          success: (created) => t`"${created.name}" has been added`,
          error: (err) => t`Error creating garment: ${err.message}`,
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
            {garment ? <Trans>Edit Garment</Trans> : <Trans>Add Garment</Trans>}
          </DialogTitle>
          <DialogDescription>
            {garment ? (
              <Trans>Update your garment details</Trans>
            ) : (
              <Trans>Add a new garment to your wardrobe</Trans>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <GarmentImageUpload
              currentImageUrl={garment?.imageUrl}
              onUploadComplete={handleImageUpload}
            />

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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      <Trans>Allow others to see and try on this garment</Trans>
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
      </DialogContent>
    </Dialog>
  );
};

export default GarmentForm;

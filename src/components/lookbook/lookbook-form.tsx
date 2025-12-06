import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/react";
import type { LookbookListProcedure } from "@/trpc/routers/lookbook";
import {
  apiLookbookCreateAndUpdate,
  type LookbookCreateAndUpdate,
} from "@/validators/lookbook";

type LookbookFormProps = {
  lookbook?: Pick<
    LookbookListProcedure[number],
    "id" | "name" | "description" | "coverId" | "isPublic"
  >;
  children?: React.ReactNode;
};

const LookbookForm = ({ lookbook, children }: LookbookFormProps) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<LookbookCreateAndUpdate>({
    resolver: zodResolver(apiLookbookCreateAndUpdate),
    defaultValues: {
      id: lookbook?.id,
      name: lookbook?.name ?? "",
      description: lookbook?.description ?? null,
      coverId: lookbook?.coverId || undefined,
      isPublic: lookbook?.isPublic ?? false,
    },
  });

  const createMutation = useMutation(
    trpc.lookbook.create.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lookbook.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.lookbook.list.queryKey()
        );

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const optimistic: LookbookListProcedure[number] = {
          id: tempId,
          userId: "",
          name: variables.name,
          description: variables.description ?? null,
          coverId: variables.coverId ?? null,
          cover: null,
          coverUrl: null,
          isPublic: variables.isPublic ?? false,
          shareSlug: null,
          itemCount: 0,
          _count: { items: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData(trpc.lookbook.list.queryKey(), (old) => {
          if (!old) return [optimistic];
          return [optimistic, ...old];
        });

        return { previousData, optimistic };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.lookbook.list.queryKey(),
          context?.previousData
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.lookbook.list.queryKey(),
        });
        form.reset();
        setOpen(false);
      },
    })
  );

  const updateMutation = useMutation(
    trpc.lookbook.update.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lookbook.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.lookbook.list.queryKey()
        );

        queryClient.setQueryData(trpc.lookbook.list.queryKey(), (old) => {
          if (!old) return previousData;
          return old.map((lb) =>
            lb.id === variables.id
              ? { ...lb, ...variables, updatedAt: new Date() }
              : lb
          );
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.lookbook.list.queryKey(),
          context?.previousData
        );
      },
      onSuccess: async (updated) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.lookbook.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.lookbook.byId.queryKey({ id: updated.id }),
        });
        setOpen(false);
      },
    })
  );

  const onSubmit = (data: LookbookCreateAndUpdate) => {
    if (data.id) {
      toast.promise(
        updateMutation.mutateAsync({
          id: data.id,
          name: data.name,
          description: data.description,
          coverId: data.coverId,
          isPublic: data.isPublic,
        }),
        {
          loading: t`Updating lookbook...`,
          success: (updated) => t`"${updated.name}" has been updated`,
          error: (err) => t`Error updating lookbook: ${err.message}`,
        }
      );
    } else {
      toast.promise(
        createMutation.mutateAsync({
          name: data.name,
          description: data.description ?? undefined,
          coverId: data.coverId,
          isPublic: data.isPublic,
        }),
        {
          loading: t`Creating lookbook...`,
          success: (created) => t`"${created.name}" has been created`,
          error: (err) => t`Error creating lookbook: ${err.message}`,
        }
      );
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {lookbook ? (
              <Trans>Edit Lookbook</Trans>
            ) : (
              <Trans>Create Lookbook</Trans>
            )}
          </DialogTitle>
          <DialogDescription>
            {lookbook ? (
              <Trans>Update your lookbook details</Trans>
            ) : (
              <Trans>Create a new lookbook to curate your try-on looks</Trans>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                      placeholder={t`e.g., Summer Outfits 2025`}
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
                      <Trans>Allow others to view this lookbook via link</Trans>
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
                lookbook ? updateMutation.isPending : createMutation.isPending
              }
              type="submit"
            >
              {lookbook ? (
                <Trans>Update Lookbook</Trans>
              ) : (
                <Trans>Create Lookbook</Trans>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LookbookForm;

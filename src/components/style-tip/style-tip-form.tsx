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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StyleTip } from "@/db/types";
import { useTRPC } from "@/trpc/react";
import {
  apiStyleTipForm,
  STYLE_TIP_CATEGORIES,
  type StyleTipForm as StyleTipFormType,
} from "@/validators/style-tip";

type StyleTipFormProps = {
  tryOnId: string;
  tip?: StyleTip;
  children?: React.ReactNode;
};

const CATEGORY_LABELS: Record<string, string> = {
  fit: "Fit",
  color: "Color",
  style: "Style",
  occasion: "Occasion",
  accessories: "Accessories",
  "fabric-care": "Fabric Care",
};

const StyleTipForm = ({ tryOnId, tip, children }: StyleTipFormProps) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<StyleTipFormType>({
    resolver: zodResolver(apiStyleTipForm),
    defaultValues: {
      id: tip?.id,
      tryOnId,
      category: (tip?.category as StyleTipFormType["category"]) ?? "style",
      content: tip?.content ?? "",
    },
  });

  const createMutation = useMutation(
    trpc.styleTip.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
        });
        form.reset({
          tryOnId,
          category: "style",
          content: "",
        });
        setOpen(false);
      },
    })
  );

  const updateMutation = useMutation(
    trpc.styleTip.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
        });
        setOpen(false);
      },
    })
  );

  const onSubmit = (data: StyleTipFormType) => {
    if (data.id) {
      toast.promise(
        updateMutation.mutateAsync({
          id: data.id,
          category: data.category,
          content: data.content,
        }),
        {
          loading: t`Updating style tip...`,
          success: t`Style tip updated`,
          error: (err) => t`Error updating: ${err.message}`,
        }
      );
    } else {
      toast.promise(
        createMutation.mutateAsync({
          tryOnId: data.tryOnId,
          category: data.category,
          content: data.content,
        }),
        {
          loading: t`Creating style tip...`,
          success: t`Style tip created`,
          error: (err) => t`Error creating: ${err.message}`,
        }
      );
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tip ? <Trans>Edit Style Tip</Trans> : <Trans>Add Style Tip</Trans>}
          </DialogTitle>
          <DialogDescription>
            {tip ? (
              <Trans>Update your style tip</Trans>
            ) : (
              <Trans>Add a custom style tip for this try-on</Trans>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                      {STYLE_TIP_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Content</Trans>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t`Enter your style tip...`}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full"
              disabled={
                tip ? updateMutation.isPending : createMutation.isPending
              }
              type="submit"
            >
              {tip ? <Trans>Update Tip</Trans> : <Trans>Add Tip</Trans>}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StyleTipForm;

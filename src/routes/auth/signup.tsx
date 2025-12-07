import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import type { SocialProvider } from "better-auth/social-providers";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signIn, signUp } from "@/auth/client";
import ContentLayout from "@/components/common/content-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { APP_LOGO_URL, APP_NAME } from "@/constants/app";
import { useTRPC } from "@/trpc/react";
import { apiUserSignup, type UserSignup } from "@/validators/auth";

export const Route = createFileRoute("/auth/signup")({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(
      context.trpc.auth.getSession.queryOptions()
    );

    if (auth) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useLingui();
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const form = useForm<UserSignup>({
    resolver: zodResolver(apiUserSignup),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const loginWithSocial = useMutation({
    mutationFn: async ({
      provider,
      callbackURL,
    }: {
      provider: SocialProvider;
      callbackURL: string;
    }) =>
      await signIn.social({
        provider,
        callbackURL: callbackURL || "/",
      }),
  });

  const register = useMutation({
    mutationFn: async (data: UserSignup) => await signUp.email(data),
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries(trpc.auth.getSession.queryFilter());
      await router.navigate({ to: "/dashboard" });
    },
  });

  const onSubmit = (data: UserSignup) => {
    toast.promise(register.mutateAsync(data), {
      loading: t`Creating your account...`,
      success: t`Account created successfully!`,
      error: t`Registration failed: Please try again`,
    });
  };

  const handleGoogleSignup = () => {
    loginWithSocial.mutate({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <ContentLayout>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link
            className="flex items-center gap-2 self-center font-medium"
            to="/"
          >
            <img alt={APP_NAME} className="h-12 w-12" src={APP_LOGO_URL} />
            <span className="font-bold text-2xl tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="space-y-1 pb-6 text-center">
                <CardTitle className="font-semibold text-xl">
                  <Trans>Create an account</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Sign up with your Google account or email</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    <Button
                      className="w-full bg-muted/50 hover:bg-muted"
                      disabled={loginWithSocial.isPending}
                      onClick={handleGoogleSignup}
                      variant="outline"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>Google</title>
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <Trans>Sign up with Google</Trans>
                    </Button>
                  </div>
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
                    <span className="relative z-10 bg-card px-2 text-muted-foreground">
                      <Trans>Or continue with</Trans>
                    </span>
                  </div>
                  <Form {...form}>
                    <form
                      className="space-y-4"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Trans>Full Name</Trans>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t`John Doe`}
                                type="text"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Trans>Email</Trans>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t`m@example.com`}
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Trans>Password</Trans>
                            </FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        className="w-full"
                        disabled={register.isPending}
                        type="submit"
                      >
                        <Trans>Create account</Trans>
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t p-4 pt-4">
                <div className="text-muted-foreground text-sm">
                  <Trans>Already have an account?</Trans>{" "}
                  <Link
                    className="text-foreground underline underline-offset-4 hover:text-[var(--auth-primary)]"
                    to="/auth"
                  >
                    <Trans>Sign in</Trans>
                  </Link>
                </div>
              </CardFooter>
            </Card>
            <div className="text-balance text-center text-muted-foreground text-xs *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
              <Trans>By clicking continue, you agree to our</Trans>{" "}
              <Link to="/terms-of-service">
                <Trans>Terms of Service</Trans>
              </Link>{" "}
              <Trans>and</Trans>{" "}
              <Link to="/privacy-policy">
                <Trans>Privacy Policy</Trans>
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

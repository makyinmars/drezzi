import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { authClient } from "@/auth/client";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { APP_LOGO_URL, APP_NAME } from "@/constants/app";

type Step = "email" | "otp" | "password";

const emailSchema = z.object({
  email: z.email(),
});

const otpSchema = z.object({
  otp: z.string().length(6),
});

const passwordSchema = z
  .object({
    password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/auth/reset-password")({
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
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Step 1: Send OTP
  const sendOTP = useMutation({
    mutationFn: async (emailValue: string) =>
      await authClient.emailOtp.sendVerificationOtp({
        email: emailValue,
        type: "forget-password",
      }),
    onSuccess: () => {
      setStep("otp");
      toast.success(t`Check your email for the verification code`);
    },
    onError: () => {
      // Don't reveal if email exists - always show success
      setStep("otp");
      toast.success(t`If an account exists, we've sent a verification code`);
    },
  });

  // Step 2 & 3: Reset password with OTP
  const resetPassword = useMutation({
    mutationFn: async ({
      email: emailValue,
      otp: otpValue,
      password,
    }: {
      email: string;
      otp: string;
      password: string;
    }) =>
      await authClient.emailOtp.resetPassword({
        email: emailValue,
        otp: otpValue,
        password,
      }),
    onSuccess: () => {
      router.navigate({ to: "/auth" });
    },
  });

  // Forms
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleEmailSubmit = (data: z.infer<typeof emailSchema>) => {
    setEmail(data.email);
    sendOTP.mutate(data.email);
  };

  const handleOtpSubmit = (data: z.infer<typeof otpSchema>) => {
    setOtp(data.otp);
    setStep("password");
  };

  const handlePasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    const handleError = (error: Error) => {
      if (error.message?.includes("INVALID_OTP")) {
        setStep("otp");
        setOtp("");
        return t`Invalid or expired code. Please try again.`;
      }
      if (error.message?.includes("TOO_MANY_ATTEMPTS")) {
        setStep("email");
        setOtp("");
        return t`Too many attempts. Please request a new code.`;
      }
      return t`Failed to reset password. Please try again.`;
    };

    toast.promise(
      resetPassword.mutateAsync({ email, otp, password: data.password }),
      {
        loading: t`Resetting password...`,
        success: t`Password reset successfully`,
        error: handleError,
      }
    );
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

          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="font-semibold text-xl">
                <Trans>Reset Password</Trans>
              </CardTitle>
              <CardDescription>
                {step === "email" && (
                  <Trans>Enter your email to receive a reset code</Trans>
                )}
                {step === "otp" && (
                  <Trans>Enter the 6-digit code sent to your email</Trans>
                )}
                {step === "password" && <Trans>Enter your new password</Trans>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Email */}
              {step === "email" && (
                <Form {...emailForm}>
                  <form
                    className="space-y-4"
                    onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
                  >
                    <FormField
                      control={emailForm.control}
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
                    <Button
                      className="w-full"
                      disabled={sendOTP.isPending}
                      type="submit"
                    >
                      <Trans>Send Reset Code</Trans>
                    </Button>
                  </form>
                </Form>
              )}

              {/* Step 2: OTP */}
              {step === "otp" && (
                <Form {...otpForm}>
                  <form
                    className="space-y-4"
                    onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
                  >
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                          <FormControl>
                            <InputOTP maxLength={6} {...field}>
                              <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button className="w-full" type="submit">
                      <Trans>Verify Code</Trans>
                    </Button>
                    <Button
                      className="w-full"
                      disabled={sendOTP.isPending}
                      onClick={() => sendOTP.mutate(email)}
                      type="button"
                      variant="ghost"
                    >
                      <Trans>Resend Code</Trans>
                    </Button>
                  </form>
                </Form>
              )}

              {/* Step 3: New Password */}
              {step === "password" && (
                <Form {...passwordForm}>
                  <form
                    className="space-y-4"
                    onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                  >
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>New Password</Trans>
                          </FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>Confirm Password</Trans>
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
                      disabled={resetPassword.isPending}
                      type="submit"
                    >
                      <Trans>Reset Password</Trans>
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4 pt-4">
              <div className="text-muted-foreground text-sm">
                <Trans>Remember your password?</Trans>{" "}
                <Link
                  className="text-foreground underline underline-offset-4 hover:text-[var(--auth-primary)]"
                  to="/auth"
                >
                  <Trans>Sign in</Trans>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ContentLayout>
  );
}

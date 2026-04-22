"use client";

import { signUpSchema } from "@/app/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { useMaintenance } from "@/contexts/MaintenanceContext";
import Logo from "@/components/web/Logo";
import z from "zod";

const SignUpPage = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { isMaintenanceMode, maintenanceMessage } = useMaintenance();

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function onSubmit(data: z.infer<typeof signUpSchema>) {
    if (isMaintenanceMode) {
      toast.error("Platform is currently under maintenance. Please try again later.");
      return;
    }
    startTransition(async () => {
      await authClient.signUp.email({
        email: data.email,
        name: data.name,
        password: data.password,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Account created successfully!");
            router.push("/");
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      });
    });
  }

  return (
    <div className="w-full space-y-4">
      {isMaintenanceMode && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-300">Under Maintenance</h3>
              <p className="text-sm text-yellow-400/80 mt-1">{maintenanceMessage}</p>
              <p className="text-xs text-yellow-500/60 mt-2">Account creation is temporarily disabled.</p>
            </div>
          </div>
        </div>
      )}

      {!isMaintenanceMode && (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
            <p className="text-white/45 text-sm mt-1.5">Start your mentorship journey today</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="text-white/60 text-sm">Full Name</FieldLabel>
                    <Input
                      aria-invalid={fieldState.invalid}
                      placeholder="John Doe"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-purple-500/50 focus-visible:ring-purple-500/20"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="text-white/60 text-sm">Email</FieldLabel>
                    <Input
                      aria-invalid={fieldState.invalid}
                      placeholder="you@example.com"
                      type="email"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-purple-500/50 focus-visible:ring-purple-500/20"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="text-white/60 text-sm">Password</FieldLabel>
                    <Input
                      aria-invalid={fieldState.invalid}
                      placeholder="••••••••"
                      type="password"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-purple-500/50 focus-visible:ring-purple-500/20"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button
                disabled={isPending}
                className="w-full bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-11 mt-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-center text-sm text-white/35 mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default SignUpPage;

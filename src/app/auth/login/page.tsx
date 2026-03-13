"use client";

import { loginSchema } from "@/app/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useMaintenance } from "@/contexts/MaintenanceContext";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const LoginPage = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { isMaintenanceMode, maintenanceMessage } = useMaintenance();

  console.log("LoginPage - isMaintenanceMode:", isMaintenanceMode, "maintenanceMessage:", maintenanceMessage);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof loginSchema>) {
    // Check maintenance mode before attempting login
    if (isMaintenanceMode) {
      toast.error("Platform is currently under maintenance. Please try again later.");
      return;
    }

    startTransition(async () => {
      await authClient.signIn.email({
        email: data.email,
        password: data.password,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged in successfully!");
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Maintenance Banner */}
        {isMaintenanceMode && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Under Maintenance</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  {maintenanceMessage}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                  Please check back later. Login is temporarily disabled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Card - Hidden during maintenance */}
        {!isMaintenanceMode && (
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Login to get started</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup className="gap-y-4">
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input
                          aria-invalid={fieldState.invalid}
                          placeholder="john@doe.com"
                          type="email"
                          {...field}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Password</FieldLabel>
                        <Input
                          aria-invalid={fieldState.invalid}
                          placeholder="******"
                          type="password"
                          {...field}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Button disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mb-6"></Loader2>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Login</span>
                    )}
                  </Button>
                </FieldGroup>
              </form>
              <Link className="text-sm text-muted-foreground hover:text-white" href="/auth/sign-up">Don't have an account? Register</Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

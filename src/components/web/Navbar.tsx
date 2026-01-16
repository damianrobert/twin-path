"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button, buttonVariants } from "../ui/button";
import { useConvexAuth } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <nav className="w-full py-5 px-2.5 flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex items-center gap-8">
          <Link href="/">
            <h1 className="text-2xl font-bold">
              Twin<span className="text-purple-600">Path</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link className={buttonVariants({ variant: "ghost" })} href="/">
            Home
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="#">
            Blog
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="#">
            Find mentor
          </Link>
        </div>
      </div>

      <div className="flex items-center mx-1">
        {isLoading ? null : isAuthenticated ? (
          <Button
            className="mx-1"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      toast.success("Logged out successfully!");
                      router.push("/");
                    },
                    onError: (error) => {
                      toast.error(error.error.message);
                    },
                  },
                });
              })
            }
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin"></Loader2>
                <span>Loading...</span>
              </>
            ) : (
              <span>Logout</span>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="mx-1">
              <Link
                className={cn(buttonVariants(), "mx-1")}
                href="/auth/sign-up"
              >
                Sign up
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/auth/login"
              >
                Login
              </Link>
            </div>
          </div>
        )}

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;

"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button, buttonVariants } from "../ui/button";
import { useConvexAuth } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import GlobalAvatar from "./GlobalAvatar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Navbar = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unreadRequestCount = useQuery(api.mentorshipRequests.getUnreadRequestCount);
  const updateOnlineStatus = useMutation(api.presence.updateOnlineStatus);

  return (
    <nav className="w-full py-5 px-2.5 flex items-center justify-between">
      <div className="flex items-center">
        <Logo />

        <div className="flex items-center gap-2">
          <Link className={buttonVariants({ variant: "ghost" })} href="/">
            Home
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="/dashboard">
            Dashboard
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="/blog">
            Blog
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="/courses">
            Courses
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="/mentors">
            Find mentor
          </Link>
          {isAuthenticated && (
            <Link className={buttonVariants({ variant: "ghost" })} href="/mentorship-requests">
              <div className="flex items-center gap-2">
                Mentorship Requests
                {unreadRequestCount !== undefined && unreadRequestCount !== null && unreadRequestCount > 0 && (
                  <div className="relative">
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center mx-1">
        {isLoading ? null : isAuthenticated ? (
          <>
            <GlobalAvatar className="mr-3" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="mx-1">Logout</Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="hover:bg-zinc-300">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="mx-1"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        // Set user offline first
                        try {
                          await updateOnlineStatus({ isOnline: false });
                        } catch (error) {
                          console.error("Failed to set offline status:", error);
                        }
                        
                        // Then proceed with logout
                        authClient.signOut({
                          fetchOptions: {
                            onSuccess: () => {
                              toast.success("Logged out successfully!");
                              // Use hard redirect to ensure clean state
                              window.location.href = "/";
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
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
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

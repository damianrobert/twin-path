"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { useConvexAuth } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
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

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Roadmaps", href: "/roadmaps" },
  { label: "Blog", href: "/blog" },
  { label: "Courses", href: "/courses" },
  { label: "Find mentor", href: "/mentors" },
];

const Navbar = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unreadRequestCount = useQuery(api.mentorshipRequests.getUnreadRequestCount);
  const updateOnlineStatus = useMutation(api.presence.updateOnlineStatus);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#020617]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/55 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/mentorship-requests"
                className="relative text-white/55 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                Requests
                {unreadRequestCount != null && unreadRequestCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-500 rounded-full" />
                )}
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? null : isAuthenticated ? (
            <>
              <GlobalAvatar className="mr-1" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/55 hover:text-white hover:bg-white/5 text-sm"
                  >
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          try {
                            await updateOnlineStatus({ isOnline: false });
                          } catch {
                            // ignore presence error on logout
                          }
                          authClient.signOut({
                            fetchOptions: {
                              onSuccess: () => {
                                toast.success("Logged out successfully!");
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
                          <Loader2 className="size-4 animate-spin" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        "Logout"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/55 hover:text-white hover:bg-white/5 text-sm"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90 text-sm font-semibold rounded-lg h-8 px-4"
                >
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

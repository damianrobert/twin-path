import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import Logo from "@/components/web/Logo";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_70%)]" />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <Link
        href="/"
        className="absolute top-5 left-5 z-10 flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="relative z-10 w-full max-w-md mx-auto py-16">{children}</div>
    </div>
  );
};

export default AuthLayout;

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Settings,
  Users,
  BarChart3,
  ArrowLeft,
  Shield,
  Headphones,
} from "lucide-react";
import AdminGuard from "@/components/web/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/admin", icon: Shield, current: pathname === "/admin" },
    { name: "Blog Reports", href: "/admin/blog-reports", icon: AlertTriangle, current: pathname === "/admin/blog-reports" },
    { name: "Users", href: "/admin/users", icon: Users, current: pathname === "/admin/users" },
    { name: "Support", href: "/admin/support", icon: Headphones, current: pathname.startsWith("/admin/support") },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, current: pathname === "/admin/analytics" },
    { name: "Settings", href: "/admin/settings", icon: Settings, current: pathname === "/admin/settings" },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen">
        {/* Ambient gradient */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.06),transparent_70%)]" />
        </div>

        {/* Header */}
        <div className="relative z-10 border-b border-white/8 bg-white/[0.02] backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Dashboard
                  </button>
                </Link>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-400" />
                  <span className="text-white font-semibold text-sm">Admin Panel</span>
                </div>
              </div>
              <p className="text-xs text-white/25 font-semibold uppercase tracking-widest">
                TwinPath Administration
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-52 flex-shrink-0">
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-3 sticky top-8">
                <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 py-2 mb-1">
                  Navigation
                </p>
                <nav className="space-y-0.5">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          item.current
                            ? "bg-violet-500/20 border border-violet-500/30 text-violet-300"
                            : "text-white/45 hover:bg-white/5 hover:text-white/80 border border-transparent"
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

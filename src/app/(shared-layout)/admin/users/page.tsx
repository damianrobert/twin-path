"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Crown,
  User,
  Mail,
  Calendar,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexErrorHandler } from "../../../../hooks/useConvexErrorHandler";
import EditUserModal from "@/components/web/EditUserModal";

interface UserType {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "mentor" | "mentee" | "both";
  isAdmin?: boolean;
  createdAt: number;
  bio?: string;
  professionalExperience?: string;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [action, setAction] = useState<"grant" | "revoke">("grant");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);

  const users = useQuery(api.admin.getAllUsers) || [];
  const adminUsers = useQuery(api.admin.getAdminUsers) || [];
  const currentUser = useQuery(api.users.getCurrentProfile);
  const grantAdminRights = useMutation(api.admin.grantAdminRights);
  const revokeAdminRights = useMutation(api.admin.revokeAdminRights);

  useConvexErrorHandler();

  const filteredUsers = users.filter((user) => {
    if (currentUser && user._id === currentUser._id) return false;
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleGrantAdmin = async (user: UserType) => {
    try {
      await grantAdminRights({ userId: user._id });
      toast.success(`Admin rights granted to ${user.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to grant admin rights");
    }
  };

  const handleRevokeAdmin = async (user: UserType) => {
    try {
      await revokeAdminRights({ userId: user._id });
      toast.success(`Admin rights revoked from ${user.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke admin rights");
    }
  };

  const confirmAction = (user: UserType, actionType: "grant" | "revoke") => {
    setSelectedUser(user);
    setAction(actionType);
    setConfirmDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedUser) return;
    if (action === "grant") await handleGrantAdmin(selectedUser);
    else await handleRevokeAdmin(selectedUser);
    setConfirmDialogOpen(false);
    setSelectedUser(null);
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString();

  const adminCount = adminUsers.filter(
    (admin) => !currentUser || admin._id !== currentUser._id
  ).length;
  const mentorCount = users.filter(
    (u) => u.role === "mentor" || u.role === "both"
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length, accent: "text-white" },
          { label: "Admin Users", value: adminCount, accent: "text-amber-400" },
          { label: "Mentors", value: mentorCount, accent: "text-violet-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-white/40 text-xs font-medium mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
            </div>
            <Users className="h-5 w-5 text-white/15" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          User Management
        </p>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-colors"
          />
        </div>

        {currentUser?.isAdmin && (
          <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <Shield className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Your account is hidden from this list</p>
              <p className="text-xs text-blue-400/70 mt-0.5">
                Admins cannot manage their own rights from this page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {user.isAdmin ? (
                    <Crown className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  ) : (
                    <User className="h-4 w-4 text-white/30 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-white">{user.name}</span>
                  {user.isAdmin && (
                    <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-white/8 border border-white/10 text-white/50 text-xs rounded-full">
                    {user.role === "both"
                      ? "Mentor & Mentee"
                      : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>

                {user.bio && (
                  <p className="text-sm text-white/35 line-clamp-2">{user.bio}</p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingUserId(user._id);
                    setEditModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/55 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>

                {user.isAdmin ? (
                  <button
                    onClick={() => confirmAction(user, "revoke")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-medium transition-colors"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    Revoke Admin
                  </button>
                ) : (
                  <button
                    onClick={() => confirmAction(user, "grant")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Grant Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">No users found</div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[oklch(0.129_0.042_264.695)] border border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {action === "grant" ? (
                <>
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Grant Admin Rights
                </>
              ) : (
                <>
                  <ShieldOff className="h-5 w-5 text-red-400" />
                  Revoke Admin Rights
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {action === "grant"
                ? `Grant full administrative access to ${selectedUser?.name}?`
                : `Revoke administrative access from ${selectedUser?.name}?`}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  {selectedUser.isAdmin ? (
                    <Crown className="h-4 w-4 text-amber-400" />
                  ) : (
                    <User className="h-4 w-4 text-white/30" />
                  )}
                  <span className="font-medium text-white">{selectedUser.name}</span>
                </div>
                <p className="text-sm text-white/45">{selectedUser.email}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialogOpen(false)}
                  className="flex-1 h-9 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  className={`flex-1 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    action === "grant"
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
                      : "bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                  }`}
                >
                  {action === "grant" ? "Grant Admin" : "Revoke Admin"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        userId={editingUserId}
      />
    </div>
  );
}

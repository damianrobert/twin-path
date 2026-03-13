"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexErrorHandler } from "../../../../hooks/useConvexErrorHandler";
import EditUserModal from "@/components/web/EditUserModal";

interface User {
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [action, setAction] = useState<"grant" | "revoke">("grant");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);

  const users = useQuery(api.admin.getAllUsers) || [];
  const adminUsers = useQuery(api.admin.getAdminUsers) || [];
  const currentUser = useQuery(api.users.getCurrentProfile);
  const grantAdminRights = useMutation(api.admin.grantAdminRights);
  const revokeAdminRights = useMutation(api.admin.revokeAdminRights);
  
  // Handle admin access errors
  useConvexErrorHandler();

  const filteredUsers = users.filter(user => {
    // Filter out current user
    if (currentUser && user._id === currentUser._id) {
      return false;
    }
    
    // Apply search filter
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleGrantAdmin = async (user: User) => {
    try {
      await grantAdminRights({ userId: user._id });
      toast.success(`Admin rights granted to ${user.name}`);
    } catch (error) {
      console.error("Error granting admin rights:", error);
      toast.error(error instanceof Error ? error.message : "Failed to grant admin rights");
    }
  };

  const handleRevokeAdmin = async (user: User) => {
    try {
      await revokeAdminRights({ userId: user._id });
      toast.success(`Admin rights revoked from ${user.name}`);
    } catch (error) {
      console.error("Error revoking admin rights:", error);
      toast.error(error instanceof Error ? error.message : "Failed to revoke admin rights");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user._id);
    setEditModalOpen(true);
  };

  const confirmAction = (user: User, actionType: "grant" | "revoke") => {
    setSelectedUser(user);
    setAction(actionType);
    setConfirmDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedUser) return;

    if (action === "grant") {
      await handleGrantAdmin(selectedUser);
    } else {
      await handleRevokeAdmin(selectedUser);
    }

    setConfirmDialogOpen(false);
    setSelectedUser(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const adminCount = adminUsers.filter(admin => 
    !currentUser || admin._id !== currentUser._id
  ).length;
  const mentorCount = users.filter(user => user.role === "mentor" || user.role === "both").length;
  const menteeCount = users.filter(user => user.role === "mentee" || user.role === "both").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentors</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {currentUser && currentUser.isAdmin && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    Note: Your account is hidden from this list
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    For security, admins cannot manage their own admin rights from this page.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {user.isAdmin === true ? (
                        <Crown className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isAdmin === true && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {user.role === "both" ? "Mentor & Mentee" : 
                         user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </div>

                  {user.bio && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {/* Edit User Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  {/* Admin Rights Buttons */}
                  {user.isAdmin === true ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmAction(user, "revoke")}
                      className="text-red-600 hover:text-red-700"
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Revoke Admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmAction(user, "grant")}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Grant Admin
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === "grant" ? (
                <>
                  <Shield className="h-5 w-5 text-green-600" />
                  Grant Admin Rights
                </>
              ) : (
                <>
                  <ShieldOff className="h-5 w-5 text-red-600" />
                  Revoke Admin Rights
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {action === "grant" 
                ? `Are you sure you want to grant admin rights to ${selectedUser?.name}? This will give them full administrative access to the platform.`
                : `Are you sure you want to revoke admin rights from ${selectedUser?.name}? They will lose access to administrative functions.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedUser && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {selectedUser.isAdmin === true ? (
                    <Crown className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">{selectedUser.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {selectedUser.role === "both" ? "Mentor & Mentee" : 
                     selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                  {selectedUser.isAdmin === true && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                className={`flex-1 ${
                  action === "grant" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {action === "grant" ? "Grant Admin" : "Revoke Admin"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        userId={editingUserId}
      />
    </div>
  );
}

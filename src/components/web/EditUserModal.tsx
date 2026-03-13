"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Key, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users"> | null;
}

interface UserProfile {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "mentor" | "mentee" | "both";
  isAdmin?: boolean;
  bio?: string;
  professionalExperience?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  yearsOfExperience?: number;
  teachingExperience?: string;
}

export default function EditUserModal({ open, onOpenChange, userId }: EditUserModalProps) {
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");
  const updateUser = useMutation(api.users.updateUserByAdmin);
  const resetUserPassword = useMutation(api.auth.resetUserPassword);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "mentee" as "mentor" | "mentee" | "both",
    isAdmin: false,
    bio: "",
    professionalExperience: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    yearsOfExperience: "",
    teachingExperience: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "mentee",
        isAdmin: user.isAdmin || false,
        bio: user.bio || "",
        professionalExperience: user.professionalExperience || "",
        portfolioUrl: user.portfolioUrl || "",
        githubUrl: user.githubUrl || "",
        linkedinUrl: user.linkedinUrl || "",
        yearsOfExperience: user.yearsOfExperience?.toString() || "",
        teachingExperience: user.teachingExperience || "",
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    
    try {
      await updateUser({
        userId: user._id,
        updateData: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isAdmin: formData.isAdmin,
          bio: formData.bio || undefined,
          professionalExperience: formData.professionalExperience || undefined,
          portfolioUrl: formData.portfolioUrl || undefined,
          githubUrl: formData.githubUrl || undefined,
          linkedinUrl: formData.linkedinUrl || undefined,
          yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
          teachingExperience: formData.teachingExperience || undefined,
        }
      });

      toast.success("User information updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user || !newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      await resetUserPassword({
        userId: user._id,
        newPassword: newPassword.trim()
      });

      toast.success("Password reset successfully");
      setNewPassword("");
      setShowPasswordReset(false);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading User Data</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit User Profile
          </DialogTitle>
          <DialogDescription>
            Modify user information and account settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {user.role === "both" ? "Mentor & Mentee" : user.role}
                    </Badge>
                    {user.isAdmin && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">User Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "mentor" | "mentee" | "both") => 
                    handleInputChange("role", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentee">Mentee</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="both">Mentor & Mentee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => handleInputChange("isAdmin", e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isAdmin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Access
                </Label>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Professional Information</h4>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full p-2 border rounded-md resize-none h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="professionalExperience">Professional Experience</Label>
                <Input
                  id="professionalExperience"
                  value={formData.professionalExperience}
                  onChange={(e) => handleInputChange("professionalExperience", e.target.value)}
                  placeholder="e.g., Software Engineer at Tech Corp"
                />
              </div>
              
              <div>
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="teachingExperience">Teaching/Mentoring Experience</Label>
              <textarea
                id="teachingExperience"
                value={formData.teachingExperience}
                onChange={(e) => handleInputChange("teachingExperience", e.target.value)}
                placeholder="Describe your teaching or mentoring experience..."
                className="w-full p-2 border rounded-md resize-none h-20"
              />
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Profile Links</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => handleInputChange("portfolioUrl", e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>
              
              <div>
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => handleInputChange("githubUrl", e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>
              
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Management
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
              >
                {showPasswordReset ? "Cancel" : "Reset Password"}
              </Button>
            </div>

            {showPasswordReset && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={!newPassword.trim()}
                      >
                        Reset Password
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordReset(false);
                          setNewPassword("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

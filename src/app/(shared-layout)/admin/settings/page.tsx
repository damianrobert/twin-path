"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Bell, 
  Shield, 
  Mail, 
  Users, 
  MessageSquare,
  FileText,
  Database,
  Globe,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  Download,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { useConvexErrorHandler } from "../../../../hooks/useConvexErrorHandler";
import { useMaintenance } from "../../../../contexts/MaintenanceContext";

interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  allowPublicProfiles: boolean;
  enableContentModeration: boolean;
  autoApprovePosts: boolean;
  enableMessaging: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultUserRole: "mentee" | "mentor" | "both";
  enableNotifications: boolean;
  notificationEmail: string;
  enableAnalytics: boolean;
  dataRetentionDays: number;
  enableBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
}

export default function AdminSettingsPage() {
  const { setMaintenanceMode, isMaintenanceMode, maintenanceMessage } = useMaintenance();
  const platformSettings = useQuery(api.platformSettings.getPlatformSettings);
  const updatePlatformSettingsMutation = useMutation(api.platformSettings.updatePlatformSettings);
  
  // Use platform settings from database as the source of truth
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: "TwinPath",
    siteDescription: "A mentorship platform connecting mentors and mentees",
    allowUserRegistration: true,
    requireEmailVerification: false,
    allowPublicProfiles: true,
    enableContentModeration: true,
    autoApprovePosts: false,
    enableMessaging: true,
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
    maintenanceMode: false,
    maintenanceMessage: "Platform is currently under maintenance. Please check back later.",
    defaultUserRole: "mentee",
    enableNotifications: true,
    notificationEmail: "admin@twinpath.com",
    enableAnalytics: true,
    dataRetentionDays: 365,
    enableBackup: true,
    backupFrequency: "daily"
  });

  // Sync local settings with database when loaded
  useEffect(() => {
    if (platformSettings) {
      setSettings(platformSettings);
    }
  }, [platformSettings]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Handle admin access errors
  useConvexErrorHandler();

  const handleSettingChange = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to database
      await updatePlatformSettingsMutation({
        settings: settings
      });
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings: PlatformSettings = {
      siteName: "TwinPath",
      siteDescription: "A mentorship platform connecting mentors and mentees",
      allowUserRegistration: true,
      requireEmailVerification: false,
      allowPublicProfiles: true,
      enableContentModeration: true,
      autoApprovePosts: false,
      enableMessaging: true,
      maxFileSize: 10485760,
      allowedFileTypes: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
      maintenanceMode: false,
      maintenanceMessage: "Platform is currently under maintenance. Please check back later.",
      defaultUserRole: "mentee",
      enableNotifications: true,
      notificationEmail: "admin@twinpath.com",
      enableAnalytics: true,
      dataRetentionDays: 365,
      enableBackup: true,
      backupFrequency: "daily"
    };
    
    setSettings(defaultSettings);
    setMaintenanceMode(false);
    localStorage.setItem("platformSettings", JSON.stringify(defaultSettings));
    toast.info("Settings reset to defaults");
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'platform-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Settings exported successfully");
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          toast.success("Settings imported successfully");
        } catch (error) {
          toast.error("Failed to import settings");
        }
      };
      reader.readAsText(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Platform Settings
          </h1>
          <p className="text-muted-foreground">
            Configure platform-wide settings and preferences
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-settings')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportSettings}
          />
          <Button variant="outline" onClick={handleResetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="flex space-x-1 border-b">
        {[
          { id: "general", label: "General", icon: Globe },
          { id: "users", label: "Users", icon: Users },
          { id: "content", label: "Content", icon: FileText },
          { id: "messaging", label: "Messaging", icon: MessageSquare },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "security", label: "Security", icon: Shield },
          { id: "backup", label: "Backup", icon: Database }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Platform Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange("siteName", e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                    placeholder="Enter site description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="defaultUserRole">Default User Role</Label>
                  <Select
                    value={settings.defaultUserRole}
                    onValueChange={(value: "mentee" | "mentor" | "both") => 
                      handleSettingChange("defaultUserRole", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentee">Mentee</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Maintenance Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable platform access
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => {
                      handleSettingChange("maintenanceMode", checked);
                    }}
                  />
                </div>

                {settings.maintenanceMode && (
                  <div>
                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.maintenanceMessage}
                      onChange={(e) => {
                        handleSettingChange("maintenanceMessage", e.target.value);
                      }}
                      placeholder="Message to show users during maintenance"
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Settings */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable new user sign-ups
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowUserRegistration}
                    onCheckedChange={(checked) => handleSettingChange("allowUserRegistration", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify email before activation
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => handleSettingChange("requireEmailVerification", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Public Profiles</Label>
                    <p className="text-sm text-muted-foreground">
                      Profiles visible to all users
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowPublicProfiles}
                    onCheckedChange={(checked) => handleSettingChange("allowPublicProfiles", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Track platform usage statistics
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableAnalytics}
                    onCheckedChange={(checked) => handleSettingChange("enableAnalytics", checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                  <Input
                    id="dataRetentionDays"
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) => handleSettingChange("dataRetentionDays", parseInt(e.target.value))}
                    placeholder="Number of days to retain user data"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Settings */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Moderation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Content Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatic content filtering
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableContentModeration}
                    onCheckedChange={(checked) => handleSettingChange("enableContentModeration", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve Posts</Label>
                    <p className="text-sm text-muted-foreground">
                      Skip manual review for posts
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoApprovePosts}
                    onCheckedChange={(checked) => handleSettingChange("autoApprovePosts", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maxFileSize">Maximum File Size</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange("maxFileSize", parseInt(e.target.value))}
                    placeholder="Maximum file size in bytes"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {formatFileSize(settings.maxFileSize)}
                  </p>
                </div>

                <div>
                  <Label>Allowed File Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.allowedFileTypes.map((type) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messaging Settings */}
        {activeTab === "messaging" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messaging Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Messaging</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to send messages
                  </p>
                </div>
                <Switch
                  checked={settings.enableMessaging}
                  onCheckedChange={(checked) => handleSettingChange("enableMessaging", checked)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to users
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange("enableNotifications", checked)}
                />
              </div>

              <div>
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(e) => handleSettingChange("notificationEmail", e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Security Notice</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      Advanced security settings will be implemented in future updates including:
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 list-disc list-inside">
                      <li>Two-factor authentication</li>
                      <li>Session management</li>
                      <li>Rate limiting</li>
                      <li>Security audit logs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Settings */}
        {activeTab === "backup" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup platform data
                  </p>
                </div>
                <Switch
                  checked={settings.enableBackup}
                  onCheckedChange={(checked) => handleSettingChange("enableBackup", checked)}
                />
              </div>

              <div>
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(value: "daily" | "weekly" | "monthly") => 
                    handleSettingChange("backupFrequency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select backup frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">Backup Information</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Backup functionality will be implemented in future updates including:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 list-disc list-inside">
                      <li>Automated database backups</li>
                      <li>File storage backups</li>
                      <li>Backup scheduling</li>
                      <li>Restore functionality</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

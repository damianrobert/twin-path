"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  Save,
  RotateCcw,
  Download,
  Upload,
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
  backupFrequency: "daily",
};

const tabs = [
  { id: "general", label: "General", icon: Globe },
  { id: "users", label: "Users", icon: Users },
  { id: "content", label: "Content", icon: FileText },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "backup", label: "Backup", icon: Database },
];

export default function AdminSettingsPage() {
  const { setMaintenanceMode } = useMaintenance();
  const platformSettings = useQuery(api.platformSettings.getPlatformSettings);
  const updatePlatformSettingsMutation = useMutation(api.platformSettings.updatePlatformSettings);

  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useConvexErrorHandler();

  useEffect(() => {
    if (platformSettings) setSettings(platformSettings);
  }, [platformSettings]);

  const set = (key: keyof PlatformSettings, value: any) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePlatformSettingsMutation({ settings });
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setMaintenanceMode(false);
    localStorage.setItem("platformSettings", JSON.stringify(defaultSettings));
    toast.info("Settings reset to defaults");
  };

  const handleExport = () => {
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const a = document.createElement("a");
    a.href = uri;
    a.download = "platform-settings.json";
    a.click();
    toast.success("Settings exported");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setSettings(JSON.parse(ev.target?.result as string));
        toast.success("Settings imported");
      } catch {
        toast.error("Failed to import settings");
      }
    };
    reader.readAsText(file);
  };

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const ToggleRow = ({
    label,
    desc,
    checked,
    onChange,
  }: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-white/40 text-xs mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  const FieldRow = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-white/55 text-xs">{label}</Label>
      {children}
    </div>
  );

  const inputCls =
    "w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-colors";
  const textareaCls =
    "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">
            Configuration
          </p>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-violet-400" />
            Platform Settings
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Configure platform-wide settings and preferences
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/55 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            onClick={() => document.getElementById("import-settings")?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/55 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </button>
          <input id="import-settings" type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/55 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black rounded-xl text-xs font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-white/8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-violet-400 text-violet-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-violet-400" />
                Platform Information
              </p>
              <FieldRow label="Site Name">
                <input
                  className={inputCls}
                  value={settings.siteName}
                  onChange={(e) => set("siteName", e.target.value)}
                  placeholder="Enter site name"
                />
              </FieldRow>
              <FieldRow label="Site Description">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={settings.siteDescription}
                  onChange={(e) => set("siteDescription", e.target.value)}
                  placeholder="Enter site description"
                />
              </FieldRow>
              <FieldRow label="Default User Role">
                <Select
                  value={settings.defaultUserRole}
                  onValueChange={(v: "mentee" | "mentor" | "both") => set("defaultUserRole", v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentee">Mentee</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Maintenance Mode
              </p>
              <ToggleRow
                label="Enable Maintenance Mode"
                desc="Temporarily disable platform access for all users"
                checked={settings.maintenanceMode}
                onChange={(v) => set("maintenanceMode", v)}
              />
              {settings.maintenanceMode && (
                <FieldRow label="Maintenance Message">
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={settings.maintenanceMessage}
                    onChange={(e) => set("maintenanceMessage", e.target.value)}
                    placeholder="Message to show users..."
                  />
                </FieldRow>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
              <p className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-violet-400" />
                User Registration
              </p>
              <ToggleRow
                label="Allow User Registration"
                desc="Enable new user sign-ups"
                checked={settings.allowUserRegistration}
                onChange={(v) => set("allowUserRegistration", v)}
              />
              <ToggleRow
                label="Require Email Verification"
                desc="Users must verify email before activation"
                checked={settings.requireEmailVerification}
                onChange={(v) => set("requireEmailVerification", v)}
              />
              <ToggleRow
                label="Allow Public Profiles"
                desc="Profiles visible to all users"
                checked={settings.allowPublicProfiles}
                onChange={(v) => set("allowPublicProfiles", v)}
              />
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
              <p className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-violet-400" />
                Privacy Settings
              </p>
              <ToggleRow
                label="Enable Analytics"
                desc="Track platform usage statistics"
                checked={settings.enableAnalytics}
                onChange={(v) => set("enableAnalytics", v)}
              />
              <FieldRow label="Data Retention (days)">
                <input
                  type="number"
                  className={inputCls}
                  value={settings.dataRetentionDays}
                  onChange={(e) => set("dataRetentionDays", parseInt(e.target.value))}
                />
              </FieldRow>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
              <p className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-violet-400" />
                Content Moderation
              </p>
              <ToggleRow
                label="Enable Content Moderation"
                desc="Automatic content filtering"
                checked={settings.enableContentModeration}
                onChange={(v) => set("enableContentModeration", v)}
              />
              <ToggleRow
                label="Auto-approve Posts"
                desc="Skip manual review for posts"
                checked={settings.autoApprovePosts}
                onChange={(v) => set("autoApprovePosts", v)}
              />
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-violet-400" />
                File Upload Settings
              </p>
              <FieldRow label="Maximum File Size">
                <input
                  type="number"
                  className={inputCls}
                  value={settings.maxFileSize}
                  onChange={(e) => set("maxFileSize", parseInt(e.target.value))}
                />
                <p className="text-xs text-white/30 mt-1">
                  Current: {formatFileSize(settings.maxFileSize)}
                </p>
              </FieldRow>
              <div>
                <p className="text-white/55 text-xs mb-2">Allowed File Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {settings.allowedFileTypes.map((type) => (
                    <span
                      key={type}
                      className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-white/50 text-xs rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "messaging" && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
            <p className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-violet-400" />
              Messaging Configuration
            </p>
            <ToggleRow
              label="Enable Messaging"
              desc="Allow users to send messages within the platform"
              checked={settings.enableMessaging}
              onChange={(v) => set("enableMessaging", v)}
            />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
            <p className="text-white font-semibold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-400" />
              Notification Configuration
            </p>
            <ToggleRow
              label="Enable Notifications"
              desc="Send email notifications to users"
              checked={settings.enableNotifications}
              onChange={(v) => set("enableNotifications", v)}
            />
            <FieldRow label="Notification Email">
              <input
                type="email"
                className={inputCls}
                value={settings.notificationEmail}
                onChange={(e) => set("notificationEmail", e.target.value)}
                placeholder="admin@example.com"
              />
            </FieldRow>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
            <p className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-violet-400" />
              Security Configuration
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-300 text-sm">Security Notice</p>
                  <p className="text-amber-400/70 text-xs mt-1">
                    Advanced security settings will be implemented in future updates including:
                  </p>
                  <ul className="text-amber-400/70 text-xs mt-2 space-y-1 list-disc list-inside">
                    <li>Two-factor authentication</li>
                    <li>Session management</li>
                    <li>Rate limiting</li>
                    <li>Security audit logs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "backup" && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
            <p className="text-white font-semibold text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-violet-400" />
              Backup Configuration
            </p>
            <ToggleRow
              label="Enable Automatic Backups"
              desc="Automatically backup platform data on schedule"
              checked={settings.enableBackup}
              onChange={(v) => set("enableBackup", v)}
            />
            <FieldRow label="Backup Frequency">
              <Select
                value={settings.backupFrequency}
                onValueChange={(v: "daily" | "weekly" | "monthly") => set("backupFrequency", v)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-300 text-sm">Backup Information</p>
                  <ul className="text-blue-400/70 text-xs mt-2 space-y-1 list-disc list-inside">
                    <li>Automated database backups</li>
                    <li>File storage backups</li>
                    <li>Backup scheduling</li>
                    <li>Restore functionality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

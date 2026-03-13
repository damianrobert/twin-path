import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Platform settings schema
export const platformSettings = {
  maintenanceMode: v.boolean(),
  maintenanceMessage: v.string(),
  siteName: v.string(),
  siteDescription: v.string(),
  allowUserRegistration: v.boolean(),
  requireEmailVerification: v.boolean(),
  allowPublicProfiles: v.boolean(),
  enableContentModeration: v.boolean(),
  autoApprovePosts: v.boolean(),
  enableMessaging: v.boolean(),
  maxFileSize: v.number(),
  allowedFileTypes: v.array(v.string()),
  defaultUserRole: v.union(v.literal("mentee"), v.literal("mentor"), v.literal("both")),
  enableNotifications: v.boolean(),
  notificationEmail: v.string(),
  enableAnalytics: v.boolean(),
  dataRetentionDays: v.number(),
  enableBackup: v.boolean(),
  backupFrequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
};

// Get platform settings
export const getPlatformSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("platformSettings").first();
    
    if (!settings) {
      // Return default settings if none exist
      return {
        maintenanceMode: false,
        maintenanceMessage: "Platform is currently under maintenance. Please check back later.",
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
        defaultUserRole: "mentee" as const,
        enableNotifications: true,
        notificationEmail: "admin@twinpath.com",
        enableAnalytics: true,
        dataRetentionDays: 365,
        enableBackup: true,
        backupFrequency: "daily" as const,
      };
    }
    
    return settings;
  },
});

// Update platform settings
export const updatePlatformSettings = mutation({
  args: {
    settings: v.object(platformSettings),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if settings already exist
    const existingSettings = await ctx.db.query("platformSettings").first();
    
    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, args.settings);
    } else {
      // Create new settings
      await ctx.db.insert("platformSettings", {
        ...args.settings,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return args.settings;
  },
});

// Update maintenance mode specifically
export const updateMaintenanceMode = mutation({
  args: {
    maintenanceMode: v.boolean(),
    maintenanceMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const existingSettings = await ctx.db.query("platformSettings").first();
    
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        maintenanceMode: args.maintenanceMode,
        maintenanceMessage: args.maintenanceMessage || existingSettings.maintenanceMessage,
      });
    } else {
      // Create default settings with maintenance mode
      await ctx.db.insert("platformSettings", {
        maintenanceMode: args.maintenanceMode,
        maintenanceMessage: args.maintenanceMessage || "Platform is currently under maintenance. Please check back later.",
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
        defaultUserRole: "mentee",
        enableNotifications: true,
        notificationEmail: "admin@twinpath.com",
        enableAnalytics: true,
        dataRetentionDays: 365,
        enableBackup: true,
        backupFrequency: "daily",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

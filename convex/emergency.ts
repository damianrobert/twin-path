import { mutation } from "./_generated/server";

// Emergency function to disable maintenance mode without authentication
export const disableMaintenanceMode = mutation({
  handler: async (ctx) => {
    console.log("Emergency: Disabling maintenance mode");
    
    // Find existing settings
    const existingSettings = await ctx.db.query("platformSettings").first();
    
    if (existingSettings) {
      // Update existing settings to disable maintenance
      await ctx.db.patch(existingSettings._id, {
        maintenanceMode: false,
        updatedAt: Date.now(),
      });
      console.log("Emergency: Maintenance mode disabled successfully");
    } else {
      // Create default settings with maintenance disabled
      await ctx.db.insert("platformSettings", {
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
      console.log("Emergency: Default settings created with maintenance disabled");
    }
    
    return { success: true, message: "Maintenance mode disabled" };
  },
});

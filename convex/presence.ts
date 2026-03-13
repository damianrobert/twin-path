import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { Id } from "./_generated/dataModel";

// Update user online status
export const updateOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      // User profile doesn't exist yet, this is normal for new users
      // Don't throw an error, just return null so the presence system can continue
      console.log("User profile not found for presence update, user may be new");
      return null;
    }

    await ctx.db.patch(userProfile._id, {
      isOnline: args.isOnline,
      lastSeen: args.isOnline ? undefined : Date.now(),
    });

    return userProfile._id;
  },
});

// Get user online status
export const getOnlineStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }

    return {
      isOnline: user.isOnline ?? false, // Default to false if undefined
      lastSeen: user.lastSeen,
    };
  },
});

// Get multiple users' online status
export const getMultipleOnlineStatus = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const statuses: Record<string, { isOnline: boolean; lastSeen?: number }> = {};
    
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        statuses[userId] = {
          isOnline: user.isOnline ?? false, // Default to false if undefined
          lastSeen: user.lastSeen,
        };
      }
    }

    return statuses;
  },
});

// Heartbeat to keep user online
export const heartbeat = mutation({
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    // Gracefully handle unauthenticated users - don't throw errors
    if (!user) {
      // User is not authenticated, just return silently
      return;
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      // User profile not found, just return silently
      return;
    }

    await ctx.db.patch(userProfile._id, {
      isOnline: true,
      lastSeen: Date.now(),
    });
  },
});

// Clean up offline users (run periodically)
export const cleanupOfflineUsers = mutation({
  args: {
    timeoutMinutes: v.number(), // Users offline for more than this time will be marked offline
  },
  handler: async (ctx, args) => {
    const timeoutMs = args.timeoutMinutes * 60 * 1000;
    const cutoffTime = Date.now() - timeoutMs;

    const onlineUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isOnline"), true))
      .collect();

    for (const user of onlineUsers) {
      // If user has been online too long without heartbeat, mark as offline
      if (user.lastSeen && user.lastSeen < cutoffTime) {
        await ctx.db.patch(user._id, {
          isOnline: false,
        });
      }
    }

    return { cleaned: onlineUsers.length };
  },
});

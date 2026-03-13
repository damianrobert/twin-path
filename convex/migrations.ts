import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Migration to add presence fields to existing users
export const migrateUserPresence = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      // Only update if the user doesn't have presence fields set
      if (user.isOnline === undefined) {
        await ctx.db.patch(user._id, {
          isOnline: false, // Default to offline
          lastSeen: undefined, // No last seen time initially
        });
      }
    }

    return { migrated: users.length };
  },
});

// Initialize presence for a new user (called during user registration)
export const initializePresence = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: true,
      lastSeen: undefined,
    });

    return args.userId;
  },
});

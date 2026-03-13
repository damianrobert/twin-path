import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Run migration to add presence fields to existing users
export const runMigration = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Only update if the user doesn't have presence fields set
      if (user.isOnline === undefined) {
        await ctx.db.patch(user._id, {
          isOnline: false, // Default to offline
          lastSeen: undefined, // No last seen time initially
        });
        updatedCount++;
      }
    }

    return { 
      totalUsers: users.length,
      updatedUsers: updatedCount,
      message: `Migration completed: ${updatedCount}/${users.length} users updated`
    };
  },
});

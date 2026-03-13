import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Grant admin rights to a user
export const grantAdminRights = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get current user and verify they are an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser || !currentUser.isAdmin) {
      throw new Error("Unauthorized: Only admins can grant admin rights");
    }

    // Update the target user to be an admin
    await ctx.db.patch(args.userId, {
      isAdmin: true,
    });

    return { success: true };
  },
});

// Revoke admin rights from a user
export const revokeAdminRights = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get current user and verify they are an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser || !currentUser.isAdmin) {
      throw new Error("Unauthorized: Only admins can revoke admin rights");
    }

    // Prevent admins from revoking their own admin rights
    if (currentUser._id === args.userId) {
      throw new Error("Cannot revoke your own admin rights");
    }

    // Update the target user to remove admin rights
    await ctx.db.patch(args.userId, {
      isAdmin: false,
    });

    return { success: true };
  },
});

// Get all admin users
export const getAdminUsers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get current user and verify they are an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser || !currentUser.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all admin users
    const adminUsers = await ctx.db
      .query("users")
      .withIndex("by_admin", (q) => q.eq("isAdmin", true))
      .collect();

    return adminUsers;
  },
});

// Get all users (for admin management)
export const getAllUsers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get current user and verify they are an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser || !currentUser.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all users
    const users = await ctx.db.query("users").collect();

    return users;
  },
});

// Check if current user is admin
export const isCurrentUserAdmin = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    return user?.isAdmin || false;
  },
});

// Create initial admin (for setup purposes)
export const createInitialAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if there are already any admin users
    const existingAdmins = await ctx.db
      .query("users")
      .withIndex("by_admin", (q) => q.eq("isAdmin", true))
      .collect();

    if (existingAdmins.length > 0) {
      throw new Error("Admin users already exist. Use grantAdminRights instead.");
    }

    // Make this user an admin
    await ctx.db.patch(user._id, {
      isAdmin: true,
    });

    return { success: true };
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new support case
export const createSupportCase = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(v.literal("technical"), v.literal("account"), v.literal("billing"), v.literal("content"), v.literal("other")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User must be logged in");
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin (admins shouldn't create support cases)
    if (user.isAdmin) {
      throw new Error("Admin users cannot create support cases");
    }

    // Generate case number (format: SC-YYYY-NNNN)
    const now = new Date();
    const year = now.getFullYear();
    const caseCount = await ctx.db.query("supportCases").collect().then(cases => 
      cases.filter(c => c.caseNumber.startsWith(`SC-${year}`)).length
    );
    const caseNumber = `SC-${year}-${String(caseCount + 1).padStart(4, '0')}`;

    // Create the support case
    const caseId = await ctx.db.insert("supportCases", {
      caseNumber,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      status: "opened",
      userId: user._id,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return caseId;
  },
});

// Get support cases for current user
export const getUserSupportCases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const cases = await ctx.db
      .query("supportCases")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return cases;
  },
});

// Get all support cases (admin only)
export const getAllSupportCases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const cases = await ctx.db
      .query("supportCases")
      .order("desc")
      .collect();

    // Fetch user details for each case
    const casesWithUsers = await Promise.all(
      cases.map(async (case_) => {
        const caseUser = await ctx.db.get(case_.userId);
        const assignedTo = case_.assignedToId ? await ctx.db.get(case_.assignedToId) : null;
        return {
          ...case_,
          user: caseUser,
          assignedTo: assignedTo,
        };
      })
    );

    return casesWithUsers;
  },
});

// Get support case by ID
export const getSupportCaseById = query({
  args: {
    caseId: v.id("supportCases"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase) {
      throw new Error("Support case not found");
    }

    // Check if user is the case owner or admin
    if (supportCase.userId !== user._id && !user.isAdmin) {
      throw new Error("Unauthorized: Access denied");
    }

    // Get user details
    const caseUser = await ctx.db.get(supportCase.userId);
    const assignedTo = supportCase.assignedToId ? await ctx.db.get(supportCase.assignedToId) : null;

    return {
      ...supportCase,
      user: caseUser,
      assignedTo: assignedTo,
      currentUser: user,
    };
  },
});

// Update support case status (admin only)
export const updateSupportCaseStatus = mutation({
  args: {
    caseId: v.id("supportCases"),
    status: v.union(v.literal("opened"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    resolution: v.optional(v.string()),
    assignedToId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase) {
      throw new Error("Support case not found");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.assignedToId) {
      updateData.assignedToId = args.assignedToId;
    }

    if (args.status === "resolved" || args.status === "closed") {
      updateData.resolvedAt = Date.now();
      if (args.resolution) {
        updateData.resolution = args.resolution;
      }
    }

    await ctx.db.patch(args.caseId, updateData);

    return { success: true };
  },
});

// Add message to support case
export const addSupportCaseMessage = mutation({
  args: {
    caseId: v.id("supportCases"),
    message: v.string(),
    isInternal: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase) {
      throw new Error("Support case not found");
    }

    // Check if user is the case owner or admin
    if (supportCase.userId !== user._id && !user.isAdmin) {
      throw new Error("Unauthorized: Access denied");
    }

    // Only admins can send internal messages
    if (args.isInternal && !user.isAdmin) {
      throw new Error("Unauthorized: Only admins can send internal messages");
    }

    // Add the message
    await ctx.db.insert("supportCaseMessages", {
      caseId: args.caseId,
      senderId: user._id,
      message: args.message,
      isInternal: args.isInternal,
      createdAt: Date.now(),
    });

    // Update case timestamp
    await ctx.db.patch(args.caseId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get support case messages
export const getSupportCaseMessages = query({
  args: {
    caseId: v.id("supportCases"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase) {
      throw new Error("Support case not found");
    }

    // Check if user is the case owner or admin
    if (supportCase.userId !== user._id && !user.isAdmin) {
      throw new Error("Unauthorized: Access denied");
    }

    // Get messages
    const messages = await ctx.db
      .query("supportCaseMessages")
      .withIndex("by_caseId", (q) => q.eq("caseId", args.caseId))
      .order("asc")
      .collect();

    // Filter internal messages for regular users
    const visibleMessages = user.isAdmin 
      ? messages 
      : messages.filter(msg => !msg.isInternal);

    // Get sender details
    const messagesWithSenders = await Promise.all(
      visibleMessages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender,
        };
      })
    );

    return messagesWithSenders;
  },
});

// Get support case statistics (admin only)
export const getSupportCaseStatistics = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const allCases = await ctx.db.query("supportCases").collect();

    const stats = {
      total: allCases.length,
      opened: allCases.filter(c => c.status === "opened").length,
      inProgress: allCases.filter(c => c.status === "in_progress").length,
      resolved: allCases.filter(c => c.status === "resolved").length,
      closed: allCases.filter(c => c.status === "closed").length,
      byCategory: {
        technical: allCases.filter(c => c.category === "technical").length,
        account: allCases.filter(c => c.category === "account").length,
        billing: allCases.filter(c => c.category === "billing").length,
        content: allCases.filter(c => c.category === "content").length,
        other: allCases.filter(c => c.category === "other").length,
      },
      byPriority: {
        low: allCases.filter(c => c.priority === "low").length,
        medium: allCases.filter(c => c.priority === "medium").length,
        high: allCases.filter(c => c.priority === "high").length,
        urgent: allCases.filter(c => c.priority === "urgent").length,
      },
    };

    return stats;
  },
});

import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Get mentorship by ID with full details
export const getMentorshipById = query({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      return null;
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return null;
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(args.mentorshipId);
    
    if (!mentorship) {
      return null;
    }

    // Check if user is part of this mentorship
    if (mentorship.menteeId !== userProfile._id && mentorship.mentorId !== userProfile._id) {
      return null;
    }

    // Get related data
    const [mentee, mentor, topic, request] = await Promise.all([
      ctx.db.get(mentorship.menteeId),
      ctx.db.get(mentorship.mentorId),
      ctx.db.get(mentorship.topicId),
      ctx.db.get(mentorship.requestId),
    ]);

    return {
      ...mentorship,
      mentee,
      mentor,
      topic,
      request: request ? {
        message: request.message,
        learningGoal: request.learningGoal,
      } : undefined,
    };
  },
});

// Get all mentorships for current user
export const getUserMentorships = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      return [];
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return [];
    }

    // Get mentorships where user is either mentor or mentee
    const mentorships = await ctx.db
      .query("mentorships")
      .filter((q) =>
        q.or(
          q.eq(q.field("mentorId"), userProfile._id),
          q.eq(q.field("menteeId"), userProfile._id)
        )
      )
      .collect();

    // Fetch related data for each mentorship
    const mentorshipsWithDetails = await Promise.all(
      mentorships.map(async (mentorship) => {
        const [mentee, mentor, topic] = await Promise.all([
          ctx.db.get(mentorship.menteeId),
          ctx.db.get(mentorship.mentorId),
          ctx.db.get(mentorship.topicId),
        ]);

        return {
          ...mentorship,
          mentee,
          mentor,
          topic,
        };
      })
    );

    return mentorshipsWithDetails;
  },
});

// Complete a mentorship
export const completeMentorship = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(args.mentorshipId);
    
    if (!mentorship) {
      throw new ConvexError("Mentorship not found");
    }

    // Check if user is part of this mentorship
    if (mentorship.menteeId !== userProfile._id && mentorship.mentorId !== userProfile._id) {
      throw new ConvexError("You are not part of this mentorship");
    }

    // Check if mentorship is already completed
    if (mentorship.status === "completed") {
      throw new ConvexError("Mentorship is already completed");
    }

    // Update mentorship status
    await ctx.db.patch(args.mentorshipId, {
      status: "completed",
      completedAt: Date.now(),
    });

    return args.mentorshipId;
  },
});

// Close a mentorship (mentor only)
export const closeMentorship = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
    closureReason: v.string(),
    finalFeedback: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(args.mentorshipId);
    
    if (!mentorship) {
      throw new ConvexError("Mentorship not found");
    }

    // Check if user is the mentor
    if (mentorship.mentorId !== userProfile._id) {
      throw new ConvexError("Only mentors can close mentorships");
    }

    // Check if mentorship is already closed or completed
    if (mentorship.status === "closed") {
      throw new ConvexError("Mentorship is already closed");
    }

    if (mentorship.status === "completed") {
      throw new ConvexError("Cannot close a completed mentorship");
    }

    // Update mentorship status
    await ctx.db.patch(args.mentorshipId, {
      status: "closed",
      closedAt: Date.now(),
      closedBy: userProfile._id,
      closureReason: args.closureReason,
      finalFeedback: args.finalFeedback,
    });

    return args.mentorshipId;
  },
});

// Get all mentorships (for analytics)
export const getAllMentorships = query({
  args: {},
  handler: async (ctx) => {
    const mentorships = await ctx.db.query("mentorships").collect();
    return mentorships;
  },
});
